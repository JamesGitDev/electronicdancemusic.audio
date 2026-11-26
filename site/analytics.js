(() => {
  'use strict';
  const config = window.EDM_ANALYTICS_CONFIG || {};
  const id = config.measurementId;
  const key = 'edm.analytics-consent.v1';
  const host = location.hostname;
  const sites = new Map([['edm.audio', 'EDM.Audio'], ['electronicdancemusic.audio', 'ElectronicDanceMusic.Audio']]);
  const allowedPage = sites.has(host) && location.protocol === 'https:' && ['/', '/index.html'].includes(location.pathname);
  const configured = /^G-[A-Z0-9]{6,20}$/.test(id || '') && config.enhancedMeasurementDisabled === true;
  if (!allowedPage || !configured) return;

  const optOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  const revision = document.documentElement.dataset.edmRelease;
  const context = {
    send_to: id, page_location: 'https://' + host + '/', page_referrer: '', page_title: sites.get(host),
    ...(/^[a-f0-9]{12}$/.test(revision || '') ? {site_revision: revision} : {}),
  };
  const noAds = {ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'};
  const dialogs = new Map([
    ['Search', 'search'], ['Library', 'saved'], ['Privacy', 'privacy'],
    ['Terms', 'terms'], ['Install', 'install_help'], ['About', 'about_dialog'], ['Menu', 'menu'],
  ]);
  const stationIds = new Set(['house', 'techno', 'trance', 'dnb']);
  const anchors = new Set(['radio', 'discover', 'app', 'about']);
  const regions = new Map([
    ['header', '.site-header'], ['radio', '#radio'], ['discover', '#discover'],
    ['app', '#app'], ['about', '#about'], ['footer', '.site-footer'], ['player', '#player'],
  ]);
  const sections = new Set([...regions.keys(), ...dialogs.values()]);
  const sources = new Set(['hero', 'artwork', 'player', 'app_demo', 'station_card', 'search', 'saved', 'keyboard', 'media_controls', 'autoplay', 'app_section', 'header', 'mobile_menu', 'footer', 'about', 'discover']);
  const appActions = new Set(['download_app', 'web_app_install_opened', 'web_app_install_result']);
  // Each row defines a stable reporting label. Only these controls can emit events.
  // Station attribution is restricted to the public station slug allowlist.
  const controls = [
    ['.site-header .brand', 'header', 'home_link'],
    ['.desktop-nav a[href="#radio"]', 'header', 'radio_link'],
    ['.desktop-nav a[href="#discover"]', 'header', 'discover_link'],
    ['.desktop-nav a[href="#app"]', 'header', 'app_link'],
    ['.site-header [data-open="saved-dialog"]', 'header', 'open_saved'],
    ['.site-header [data-open="search-dialog"]', 'header', 'open_search'],
    ['.site-header .header-listen', 'header', 'find_sound', true],
    ['.site-header [data-open="menu-dialog"]', 'header', 'open_menu'],
    ['#hero-play', 'radio', 'hero_play', true],
    ['#art-play', 'radio', 'hero_art_play', true],
    ['#radio a[href="#discover"]', 'radio', 'explore_sounds', true],
    ['#hero-app-link', 'radio', 'hero_app_link', true],
    ['#discover [data-filter]', 'discover', 'genre_filter'],
    ['#discover [data-play]', 'discover', 'station_play', true],
    ['#discover [data-save]', 'discover', 'station_save'],
    ['#discover-app-link', 'discover', 'discover_app_link', true],
    ['#install-button', 'app', 'android_download', true],
    ['#install-web-button', 'app', 'web_install', true],
    ['#app a[href="./release-notes.txt"]', 'app', 'release_notes'],
    ['#phone-play', 'app', 'app_demo_play', true],
    ['#about a[href="#discover"]', 'about', 'about_discover', true],
    ['.site-footer .brand', 'footer', 'home_link'],
    ['.site-footer [data-open="privacy-dialog"]', 'footer', 'privacy_link'],
    ['#share-button', 'footer', 'share'],
    ['#player-save', 'player', 'player_save'],
    ['#previous-button', 'player', 'previous_station'],
    ['#player-play', 'player', 'player_play', true],
    ['#next-button', 'player', 'next_station'],
    ['#mute-button', 'player', 'mute'],
    ['#search-results button[data-result-station]', 'search', 'result_play'],
    ['#search-results [data-save]', 'search', 'result_save'],
    ['#saved-results button[data-result-station]', 'saved', 'saved_play'],
    ['#saved-results [data-save]', 'saved', 'saved_toggle'],
    ['#menu-dialog a[href="#radio"]', 'menu', 'radio_link'],
    ['#menu-dialog a[href="#discover"]', 'menu', 'discover_link'],
    ['#menu-dialog a[href="#app"]', 'menu', 'app_link'],
    ['#menu-dialog a[href="#about"]', 'menu', 'about_link'],
    ['#menu-dialog [data-open="saved-dialog"]', 'menu', 'open_saved'],
    ['#privacy-dialog a[href$="/app/transfer-settings"]', 'privacy', 'import_preferences'],
    ['#privacy-dialog a[href="https://policies.google.com/privacy"]', 'privacy', 'provider_privacy'],
  ];
  const controlNames = new Set([...controls.map(([, , label]) => label), 'volume', 'close_dialog']);
  const outcomes = new Set([
    'no_results', 'one_result', 'multiple_results', 'accepted', 'dismissed', 'manual_instructions',
    'prompt_error', 'browser_blocked', 'source_unavailable', 'retry_exhausted', 'muted', 'unmuted',
  ]);
  const events = new Set([
    'page_view', 'section_view', 'navigate_section', 'playback_requested', 'playback_started',
    'playback_paused', 'playback_error', 'playback_retry', 'playback_buffering',
    'select_station', 'filter_stations', 'save_station', 'remove_saved_station', 'open_search',
    'open_library', 'download_app', 'web_app_install_opened', 'web_app_installed', 'share_site', 'page_departure',
    'control_impression', 'control_click', 'control_engaged', 'control_change', 'search_results',
    'playback_blocked', 'web_app_install_result',
  ]);
  let enabled = false, loaded = false, pageSent = false, away = false;
  let foreground = document.visibilityState === 'visible';
  let screen = 'Home', playback = 'paused', station = null, mode = 'preview', audible = false;
  let launchSource = null, launchSection = null, appEntry = 'app_section';
  let since = performance.now(), exposureAt = since, observer;
  const controlObservers = [];
  const visibleSections = new Set();
  const seenSections = new Set();
  const seenControls = new Set();
  const engagedControls = new Set();
  const exposureTotals = new Map();

  function tag() { (window.dataLayer = window.dataLayer || []).push(arguments); }
  function event(name, selected, details = {}) {
    if (!enabled || !loaded || away || !events.has(name)) return;
    const params = {...context};
    if (stationIds.has(selected)) params.station = selected;
    if (sections.has(details.section)) params.site_section = details.section;
    const source = appActions.has(name) ? appEntry : details.source;
    if (sources.has(source)) params.interaction_source = source;
    if (controlNames.has(details.control)) params.site_control = details.control;
    if (outcomes.has(details.outcome)) params.outcome = details.outcome;
    if (details.mode === 'preview' || details.mode === 'live') params.playback_mode = details.mode;
    tag('event', name, params);
  }
  function resetTiming() { since = performance.now(); }
  function accrueExposure() {
    const now = performance.now();
    const elapsed = Math.min(120000, Math.max(0, Math.round(now - exposureAt)));
    exposureAt = now;
    if (!elapsed || !enabled || !foreground || away) return;
    const dialog = dialogs.get(screen);
    for (const section of dialog ? [dialog] : visibleSections) {
      exposureTotals.set(section, (exposureTotals.get(section) || 0) + elapsed);
    }
  }
  function flushExposure() {
    accrueExposure();
    for (const [section, duration] of exposureTotals) {
      if (duration < 250) continue;
      tag('event', 'section_time', {...context, site_section: section, section_duration_ms: duration});
    }
    exposureTotals.clear();
  }
  function flush() {
    const now = performance.now();
    // Bound a single sample so a suspended tab cannot create hours of listening time.
    const elapsed = Math.min(120000, Math.max(0, Math.round(now - since)));
    since = now;
    if (!elapsed || !enabled || !loaded || away) return;
    const params = {...context, screen};
    if (foreground) {
      tag('event', 'foreground_time', {...params, foreground_duration_ms: elapsed});
      tag('event', 'screen_time', {...params, screen_duration_ms: elapsed});
    }
    const listening = playback === 'playing' && audible;
    if (listening || playback === 'buffering') {
      tag('event', listening ? 'playback_time' : 'buffering_time', {
        ...params, playback_mode: mode, ...(station ? {station} : {}),
        ...(launchSource ? {interaction_source: launchSource} : {}),
        ...(launchSection ? {site_section: launchSection} : {}),
        [listening ? 'playback_duration_ms' : 'buffering_duration_ms']: elapsed,
      });
    }
  }
  function view(value) {
    if ((value !== 'Home' && !dialogs.has(value)) || value === screen) return;
    accrueExposure();
    flush();
    screen = value;
    const region = dialogs.get(value);
    if (enabled && region && !seenSections.has(region)) {
      seenSections.add(region);
      event('section_view', null, {section: region});
    }
    watchSections();
  }
  function state(value, selected, details = {}) {
    if (!['playing', 'buffering', 'paused'].includes(value)) return;
    const nextStation = stationIds.has(selected) ? selected : null;
    const nextMode = details.mode === 'live' ? 'live' : 'preview';
    const nextAudible = details.audible === true;
    const nextSource = sources.has(details.source) ? details.source : null;
    const nextSection = sections.has(details.section) ? details.section : null;
    if (playback === value && station === nextStation && mode === nextMode && audible === nextAudible &&
        launchSource === nextSource && launchSection === nextSection) return;
    flush();
    playback = value;
    station = nextStation;
    mode = nextMode;
    audible = nextAudible;
    launchSource = nextSource;
    launchSection = nextSection;
  }

  function stopWatching() {
    observer?.disconnect();
    for (const controlObserver of controlObservers) controlObserver.disconnect();
    controlObservers.length = 0;
    visibleSections.clear();
  }
  function watchSections() {
    stopWatching();
    if (!enabled || !foreground || away || dialogs.has(screen) || !('IntersectionObserver' in window)) return;
    const sectionByElement = new Map();
    observer = new IntersectionObserver(entries => {
      if (!enabled || !foreground || away) return;
      accrueExposure();
      for (const entry of entries) {
        const section = sectionByElement.get(entry.target);
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.1;
        if (!visible) {
          visibleSections.delete(section);
          continue;
        }
        // The pinned player's usage is measured through its controls and playback.
        if (section !== 'player') visibleSections.add(section);
        if (seenSections.has(section)) continue;
        seenSections.add(section);
        event('section_view', null, {section});
      }
    }, {threshold: 0.1});
    for (const [section, selector] of regions) {
      const element = document.querySelector(selector);
      if (!element) continue;
      sectionByElement.set(element, section);
      observer.observe(element);
    }
    function watchControls(pinned, rootMargin = '0px') {
      const controlByElement = new Map();
      const controlObserver = new IntersectionObserver(entries => {
        if (!enabled || !foreground || away || dialogs.has(screen)) return;
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.5) continue;
          const [section, control] = controlByElement.get(entry.target);
          const station = stationFor(entry.target);
          const key = controlKey(section, control, station);
          if (seenControls.has(key)) continue;
          seenControls.add(key);
          event('control_impression', station, {section, control});
          controlObserver.unobserve(entry.target);
        }
      }, {threshold: 0.5, rootMargin});
      controlObservers.push(controlObserver);
      for (const [selector, section, control, impression] of controls) {
        if (!impression || (section === 'player') !== pinned) continue;
        for (const element of document.querySelectorAll(selector)) {
          if (seenControls.has(controlKey(section, control, stationFor(element)))) continue;
          controlByElement.set(element, [section, control]);
          controlObserver.observe(element);
        }
      }
    }
    const playerHeight = Math.round(document.getElementById('player')?.getBoundingClientRect().height || 0);
    watchControls(false, `0px 0px -${playerHeight}px 0px`);
    watchControls(true);
  }
  function stationFor(element) {
    const {play, save, filter, resultStation} = element.dataset;
    const value = play || save || filter || resultStation;
    return stationIds.has(value) ? value : null;
  }
  function controlKey(section, control, station) {
    return [section, control, station].join('/');
  }
  // Capture runs before click handlers close dialogs or remove result buttons.
  document.addEventListener('click', click => {
    if (!enabled) return;
    for (const [selector, section, control] of controls) {
      const element = click.target.closest?.(selector);
      if (!element) continue;
      const station = stationFor(element);
      event('control_click', station, {section, control});
      const key = controlKey(section, control, station);
      if (seenControls.has(key) && !engagedControls.has(key)) {
        engagedControls.add(key);
        event('control_engaged', station, {section, control});
      }
      break;
    }
    const dialog = dialogs.get(screen);
    if (dialog && click.target.closest?.('dialog [data-close]')) {
      event('control_click', null, {section: dialog, control: 'close_dialog'});
    }
    const link = click.target.closest?.('a[href^="#"]');
    const section = link?.getAttribute('href').slice(1);
    if (!anchors.has(section)) return;
    const source = link.closest('.mobile-nav-dialog') ? 'mobile_menu' : link.closest('.site-header') ? 'header'
      : link.closest('.site-footer') ? 'footer' : link.closest('#about') ? 'about'
      : link.closest('#discover') ? 'discover' : 'hero';
    if (section === 'app') appEntry = source;
    event('navigate_section', null, {section, source});
  }, true);

  function choice() {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return typeof value === 'boolean' ? value : null;
    } catch { return null; }
  }
  function remember(value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }
  function removeCookies() {
    for (const item of document.cookie.split(';')) {
      const name = item.split('=')[0].trim();
      if (!/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) continue;
      for (const domain of ['', host, '.' + host]) {
        document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax; Secure' + (domain ? '; Domain=' + domain : '');
      }
    }
  }
  function start() {
    window['ga-disable-' + id] = false;
    if (!loaded) {
      loaded = true;
      window.gtag = tag;
      tag('consent', 'default', {analytics_storage: 'denied', ...noAds});
      tag('set', 'ads_data_redaction', true);
      tag('set', 'url_passthrough', false);
      const {page_location, page_referrer, page_title} = context;
      tag('set', {page_location, page_referrer, page_title});
      tag('consent', 'update', {analytics_storage: 'granted', ...noAds});
      tag('js', new Date());
      tag('config', id, {
        send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
        cookie_flags: 'SameSite=Lax;Secure', cookie_expires: 2592000, page_location, page_referrer, page_title,
      });
      const script = document.createElement('script');
      script.id = 'edm-google-analytics';
      script.async = true;
      script.referrerPolicy = 'no-referrer';
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
      document.head.append(script);
    } else {
      tag('consent', 'update', {analytics_storage: 'granted', ...noAds});
    }
    if (!pageSent) {
      pageSent = true;
      event('page_view');
    }
    watchSections();
  }
  function render() {
    document.getElementById('analytics-consent')?.toggleAttribute('hidden', optOut || choice() !== null);
    const status = document.getElementById('analytics-status');
    if (status) status.textContent = optOut ? 'Off — respecting your browser privacy preference.' : enabled ? 'On for this browser.' : 'Off for this browser.';
    const allow = document.getElementById('analytics-enable');
    if (allow) allow.disabled = optOut || enabled;
    const deny = document.getElementById('analytics-disable');
    if (deny) deny.disabled = !enabled && choice() === false;
  }
  function consent(value, persist = true) {
    resetTiming();
    exposureAt = since;
    exposureTotals.clear();
    const permitted = value === true && !optOut;
    enabled = persist ? remember(permitted) && permitted : permitted;
    if (enabled) start();
    else {
      appEntry = 'app_section';
      stopWatching();
      window['ga-disable-' + id] = true;
      if (loaded) tag('consent', 'update', {analytics_storage: 'denied', ...noAds});
      removeCookies();
    }
    render();
  }
  window.EDM_ANALYTICS = Object.freeze({event, consent, view, state, isEnabled: () => enabled});
  document.querySelectorAll('[data-analytics-choice]').forEach(button => {
    button.addEventListener('click', () => consent(button.dataset.analyticsChoice === 'allow'));
  });
  document.getElementById('analytics-enable')?.addEventListener('click', () => consent(true));
  document.getElementById('analytics-disable')?.addEventListener('click', () => consent(false));
  document.getElementById('clear-data')?.addEventListener('click', () => consent(false));
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) consent(choice() === true, false);
  });
  document.addEventListener('visibilitychange', () => {
    flush();
    flushExposure();
    foreground = document.visibilityState === 'visible';
    watchSections();
  });
  window.addEventListener('pagehide', () => {
    if (away) return;
    flush();
    flushExposure();
    event('page_departure');
    away = true;
    stopWatching();
  });
  window.addEventListener('pageshow', () => {
    if (!away) return;
    away = false;
    foreground = document.visibilityState === 'visible';
    resetTiming();
    exposureAt = since;
    watchSections();
  });
  setInterval(() => { flush(); flushExposure(); }, 60000);
  consent(choice() === true, false);
})();
