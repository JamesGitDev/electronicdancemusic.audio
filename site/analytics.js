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
  const views = new Set(['Home', 'Search', 'Library', 'Privacy', 'Terms', 'Install', 'About']);
  const stationIds = new Set(['house', 'techno', 'trance', 'dnb']);
  const sections = new Set(['radio', 'discover', 'app', 'about']);
  const sources = new Set(['hero', 'artwork', 'player', 'app_demo', 'station_card', 'search', 'saved', 'keyboard', 'media_controls', 'autoplay', 'app_section', 'header', 'mobile_menu', 'footer', 'about']);
  const events = new Set([
    'page_view', 'section_view', 'navigate_section', 'playback_requested', 'playback_started',
    'playback_paused', 'playback_error', 'playback_retry', 'playback_buffering',
    'select_station', 'filter_stations', 'save_station', 'remove_saved_station', 'open_search',
    'open_library', 'download_app', 'web_app_install_opened', 'web_app_installed', 'share_site', 'page_departure',
  ]);
  let enabled = false, loaded = false, pageSent = false, away = false;
  let foreground = document.visibilityState === 'visible';
  let screen = 'Home', playback = 'paused', station = null, mode = 'preview', audible = false;
  let since = performance.now(), observer;
  const seenSections = new Set();

  function tag() { (window.dataLayer = window.dataLayer || []).push(arguments); }
  function event(name, selected, details = {}) {
    if (!enabled || !loaded || away || !events.has(name)) return;
    const params = {...context};
    if (stationIds.has(selected)) params.station = selected;
    if (sections.has(details.section)) params.site_section = details.section;
    if (sources.has(details.source)) params.interaction_source = details.source;
    if (details.mode === 'preview' || details.mode === 'live') params.playback_mode = details.mode;
    tag('event', name, params);
  }
  function resetTiming() { since = performance.now(); }
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
        [listening ? 'playback_duration_ms' : 'buffering_duration_ms']: elapsed,
      });
    }
  }
  function view(value) {
    if (!views.has(value) || value === screen) return;
    flush();
    screen = value;
  }
  function state(value, selected, details = {}) {
    if (!['playing', 'buffering', 'paused'].includes(value)) return;
    const nextStation = stationIds.has(selected) ? selected : null;
    const nextMode = details.mode === 'live' ? 'live' : 'preview';
    const nextAudible = details.audible === true;
    if (playback === value && station === nextStation && mode === nextMode && audible === nextAudible) return;
    flush();
    playback = value;
    station = nextStation;
    mode = nextMode;
    audible = nextAudible;
  }

  function watchSections() {
    observer?.disconnect();
    if (!enabled || !foreground || away || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      if (!enabled || !foreground || away) return;
      for (const entry of entries) {
        const section = entry.target.id;
        if (!entry.isIntersecting || entry.intersectionRatio < 0.05 || seenSections.has(section)) continue;
        seenSections.add(section);
        event('section_view', null, {section});
        observer.unobserve(entry.target);
      }
    }, {threshold: 0.05, rootMargin: '0px 0px -15% 0px'});
    for (const id of sections) {
      const section = document.getElementById(id);
      if (section && !seenSections.has(id)) observer.observe(section);
    }
  }
  document.addEventListener('click', click => {
    if (!enabled) return;
    const link = click.target.closest?.('a[href^="#"]');
    const section = link?.getAttribute('href').slice(1);
    if (!sections.has(section)) return;
    const source = link.closest('.mobile-nav-dialog') ? 'mobile_menu' : link.closest('.site-header') ? 'header'
      : link.closest('.site-footer') ? 'footer' : link.closest('#about') ? 'about' : 'hero';
    event('navigate_section', null, {section, source});
  });

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
    const permitted = value === true && !optOut;
    enabled = persist ? remember(permitted) && permitted : permitted;
    if (enabled) start();
    else {
      observer?.disconnect();
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
    foreground = document.visibilityState === 'visible';
    watchSections();
  });
  window.addEventListener('pagehide', () => {
    if (away) return;
    flush();
    event('page_departure');
    away = true;
    observer?.disconnect();
  });
  window.addEventListener('pageshow', () => {
    if (!away) return;
    away = false;
    foreground = document.visibilityState === 'visible';
    resetTiming();
    watchSections();
  });
  setInterval(flush, 60000);
  consent(choice() === true, false);
})();
