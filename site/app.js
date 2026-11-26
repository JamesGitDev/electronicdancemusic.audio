(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const config = window.EDM_CONFIG || {stations:[],liveMode:false};
  const live = config.liveMode === true;
  const usage = (event, station, details) => { try { window.EDM_ANALYTICS?.event(event, station, details); } catch {} };
  const playbackMode = live ? 'live' : 'preview';
  const playbackSections = {hero:'radio',artwork:'radio',app_demo:'app',station_card:'discover',search:'search',saved:'saved',player:'player',media_controls:'player',keyboard:'player',autoplay:'radio'};
  let playbackSource = 'player', reportedPlaybackStart = false;
  const playbackContext = () => ({source:playbackSource, section:playbackSections[playbackSource], mode:playbackMode});
  const allStations = Array.isArray(config.stations) ? config.stations : [];
  const stations = allStations.filter(s => s && /^[a-z0-9-]+$/.test(s.id) && (!live || safeUrl(s.streamUrl)));
  const audio = $('radio-audio');
  const keys = {saved:'edm.saved.v1',station:'edm.station.v1',volume:'edm.volume.v1'};
  const storage = {
    get(key,fallback) {try {const v=localStorage.getItem(key);return v === null ? fallback : JSON.parse(v);} catch {return fallback;}},
    set(key,value) {try {localStorage.setItem(key,JSON.stringify(value));} catch {}},
    remove(key) {try {localStorage.removeItem(key);} catch {}}
  };
  const savedValue = storage.get(keys.saved,[]);
  let saved = new Set(Array.isArray(savedValue) ? savedValue.filter(id => allStations.some(s=>s.id===id)) : []);
  let current = stations.find(s=>s.id===storage.get(keys.station,'')) || stations[0];
  let status = 'ready', wantsPlay = false, operation = 0, retryCount = 0;
  let retryTimer, watchdogTimer, stableTimer, toastTimer, metadataTimer, metadataAbort, installPrompt;
  let metadata = null, renderProgressAt = 0;
  const playButtons = [$('hero-play'),$('art-play'),$('player-play'),$('phone-play')];
  const retries = [1500,3000,6000,12000];
  let volume = Number(storage.get(keys.volume,.7));
  if (!Number.isFinite(volume)) volume=.7;
  audio.volume=Math.min(1,Math.max(0,volume));
  $('volume').value=audio.volume;

  function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url=new URL(value,location.href);
      if (url.username || url.password) return null;
      if (url.protocol==='https:' || (url.origin===location.origin && /^https?:$/.test(url.protocol))) return url.href;
    } catch {}
    return null;
  }

  const responsiveArtwork = {"/assets/house.webp":{"src":"./assets/house-640.2f70943ff61c.webp","thumb":"./assets/house-192.eb7e98b40bca.webp","srcset":"./assets/house-64.48f3d98f1f68.webp 64w, ./assets/house-192.eb7e98b40bca.webp 192w, ./assets/house-384.245125615932.webp 384w, ./assets/house-640.2f70943ff61c.webp 640w"},"/assets/techno.webp":{"src":"./assets/techno-640.be664c723b09.webp","thumb":"./assets/techno-192.88c570f419f6.webp","srcset":"./assets/techno-64.5fc6337f30e3.webp 64w, ./assets/techno-192.88c570f419f6.webp 192w, ./assets/techno-384.f11349c4d1e4.webp 384w, ./assets/techno-640.be664c723b09.webp 640w"},"/assets/trance.webp":{"src":"./assets/trance-640.d937d167934d.webp","thumb":"./assets/trance-192.3d5afd23c8cf.webp","srcset":"./assets/trance-64.c7d56450b402.webp 64w, ./assets/trance-192.3d5afd23c8cf.webp 192w, ./assets/trance-384.c3353b5ec809.webp 384w, ./assets/trance-640.d937d167934d.webp 640w"},"/assets/dnb.webp":{"src":"./assets/dnb-640.3dec3b4d3360.webp","thumb":"./assets/dnb-192.07cd129b230c.webp","srcset":"./assets/dnb-64.69d83bdac170.webp 64w, ./assets/dnb-192.07cd129b230c.webp 192w, ./assets/dnb-384.ad6e184157a2.webp 384w, ./assets/dnb-640.3dec3b4d3360.webp 640w"}};
  function artworkVariant(value) {
    try { const url=new URL(value,location.href); return url.origin===location.origin ? responsiveArtwork[url.pathname] : null; } catch { return null; }
  }
  function setArtwork(element,value,slot) {
    const variant=artworkVariant(value);
    if(variant) {
      element.sizes=slot==='player'?'56px':slot==='small'?'48px':slot==='phone'?'240px':'(max-width: 760px) calc((100vw - 56px) / 2), (max-width: 900px) calc((100vw - 68px) / 2), 25vw';
      element.srcset=variant.srcset;element.src=variant.src;
    } else {
      element.removeAttribute('srcset');element.removeAttribute('sizes');
      if(value)element.src=value;else element.removeAttribute('src');
    }
  }

  function androidDownload() {
    const href=safeUrl(config.androidAppUrl);
    if(!href)return null;
    const url=new URL(href);
    const match=url.pathname.match(/^\/downloads\/(Uplink-Listener-(\d+\.\d+\.\d+(?:-rc[1-9]\d{0,2})?)\.apk)$/);
    if(url.origin!==location.origin||url.search||url.hash||!match)return null;
    return {href:url.href,filename:match[1],version:match[2]};
  }
  function icon(button,name) {const use=button.querySelector('use');if(use) use.setAttribute('href','#i-'+name);}
  function announce(message) {
    clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('visible');
    toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3200);
  }
  function clearWaiting() {clearTimeout(retryTimer);clearTimeout(watchdogTimer);clearTimeout(stableTimer);retryTimer=null;watchdogTimer=null;stableTimer=null;}
  function reportPlaybackState() {
    const state = status === 'playing' ? 'playing' : ['buffering','connecting','reconnecting'].includes(status) ? 'buffering' : 'paused';
    try { window.EDM_ANALYTICS?.state(state, current?.id, {...playbackContext(), audible:!audio.muted && audio.volume>0}); } catch {}
  }
  function updateState(next, outcome) {
    const previous=status; status=next;
    reportPlaybackState();
    const details = playbackContext();
    if(previous!==next&&next==='reconnecting')usage('playback_retry',current?.id,details);
    if(previous!==next&&next==='buffering')usage('playback_buffering',current?.id,details);
    if(previous!==next&&next==='paused'&&['playing','connecting','reconnecting','buffering'].includes(previous))usage('playback_paused',current?.id,details);
    if(previous!==next&&next==='error')usage('playback_error',current?.id,{...details,outcome});
    if(previous!==next&&next==='blocked')usage('playback_blocked',current?.id,{...details,outcome:'browser_blocked'});
    if(next==='playing'&&!reportedPlaybackStart){
      reportedPlaybackStart=true;
      usage('playback_started',current?.id,details);
    }
    const playing=next==='playing';
    const pending=next==='connecting'||next==='reconnecting'||next==='buffering';
    document.body.classList.toggle('is-playing',playing);
    document.body.dataset.playerState=next;
    const messages={ready:'Ready when you are',connecting:'Connecting…',playing:live?'Live now':'Playing original preview',blocked:'Tap to listen',paused:'Paused',reconnecting:'Reconnecting…',buffering:'Buffering…',offline:'Waiting for connection',error:'Unable to play · Try again',unavailable:'Stream coming soon'};
    $('player-status').textContent=messages[next]||messages.ready;
    $('mobile-player-status').textContent=messages[next]||messages.ready;
    for(const button of playButtons) {
      icon(button,playing?'pause':'play');
      button.setAttribute('aria-label',playing?'Pause audio':pending?'Cancel playback request':'Play '+(current?.title||'audio'));
    }
    $('hero-play').querySelector('span').textContent=playing?'Pause listening':pending?'Connecting…':next==='blocked'?'Tap to listen':next==='error'?'Try again':'Start listening';
    const hints={blocked:'Your browser needs one tap to start the sound.',offline:'You’re offline. We’ll reconnect when your signal returns.',error:'The audio could not connect. Tap Play to try again.',connecting:'Finding your frequency…',reconnecting:'Your connection dropped. Finding the beat again…',buffering:'A little buffering. The music will return shortly.',unavailable:'The live station is getting ready. Check back soon.'};
    $('playback-hint').textContent=hints[next]||(live?'Your live frequency. Wherever you are.':'Original preview mixes. One tap takes you in.');
    for(const card of document.querySelectorAll('[data-channel]')) {
      const selected=card.dataset.channel===current?.id;
      card.classList.toggle('is-selected',selected&&playing);
      const control=card.querySelector('[data-play]');
      if(control){icon(control,selected&&playing?'pause':'play');const s=stations.find(s=>s.id===card.dataset.channel);if(s)control.setAttribute('aria-label',(selected&&playing?'Pause ':'Play ')+s.name+(live?'':': '+s.title));}
    }
    if('mediaSession' in navigator) {try{navigator.mediaSession.playbackState=playing?'playing':wantsPlay?'none':'paused';}catch{}}
  }
  function setWatchdog() {
    clearTimeout(watchdogTimer);
    watchdogTimer=setTimeout(()=>{if(wantsPlay && status!=='playing') scheduleRetry();},20000);
  }
  function setSource(force=false) {
    if(!current) return false;
    const source=safeUrl(live?current.streamUrl:current.previewUrl);
    if(!source) return false;
    if(force || audio.src!==source) {
      audio.src=source;audio.loop=!live;
      // Keep one media element. No Web Audio graph: cross-origin radio may lack analyser CORS.
      audio.load();
    }
    return true;
  }
  function startPlayback({autoplay=false,retrying=false,source='player'}={}) {
    if(!current){updateState('unavailable');return Promise.resolve();}
    clearWaiting();
    wantsPlay=true;
    const token=++operation;
    if(!retrying){
      retryCount=0;
      playbackSource=autoplay?'autoplay':source;
      reportedPlaybackStart=false;
      usage('playback_requested',current.id,playbackContext());
    }
    if(!setSource(retrying)){wantsPlay=false;updateState('error','source_unavailable');return Promise.resolve();}
    updateState(retrying?'reconnecting':'connecting');
    setWatchdog();
    // This call is synchronous within the click handler, preserving mobile user activation.
    let promise;
    try {promise=audio.play();} catch(error){promise=Promise.reject(error);}
    return Promise.resolve(promise).then(()=>{
      if(token!==operation || !wantsPlay) return;
      updateState('playing');
      refreshMetadata();
    }).catch(error=>{
      if(token!==operation || !wantsPlay) return;
      clearTimeout(watchdogTimer);
      if(error.name==='NotAllowedError') {
        wantsPlay=false;clearWaiting();audio.pause();audio.removeAttribute('src');audio.load();updateState('blocked');
      } else if(error.name!=='AbortError') {
        scheduleRetry();
      } else {
        setWatchdog();
      }
    });
  }
  function pausePlayback() {
    wantsPlay=false;++operation;clearWaiting();stopMetadata();audio.pause();
    if(live){audio.removeAttribute('src');audio.load();}
    updateState('paused');
  }
  function togglePlayback(source) {
    if(wantsPlay || (!audio.paused&&status==='playing')) pausePlayback();
    else startPlayback({source});
  }
  function scheduleRetry() {
    if(!wantsPlay || retryTimer) return;
    clearTimeout(watchdogTimer);clearTimeout(stableTimer);
    if(!navigator.onLine){updateState('offline');return;}
    if(retryCount>=retries.length) {
      wantsPlay=false;++operation;audio.pause();clearWaiting();stopMetadata();updateState('error','retry_exhausted');return;
    }
    updateState('reconnecting');
    const delay=retries[retryCount++];
    retryTimer=setTimeout(()=>{retryTimer=null;if(wantsPlay)startPlayback({retrying:true});},delay);
  }
  function chooseStation(id,{play=true,source='station_card'}={}) {
    const next=stations.find(s=>s.id===id);
    if(!next) return;
    if(current?.id===id&&play){togglePlayback(source);return;}
    wantsPlay=false;++operation;clearWaiting();stopMetadata();audio.pause();
    current=next;metadata=null;retryCount=0;storage.set(keys.station,id);usage('select_station',id,{source,mode:playbackMode});
    audio.removeAttribute('src');audio.load();
    updateStation();updateState('ready');
    if(play)startPlayback({source});
  }
  function stepStation(direction,source='player') {
    if(stations.length<2) return;
    const index=stations.indexOf(current);chooseStation(stations[(index+direction+stations.length)%stations.length].id,{source});
  }
  function updateStation() {
    if(!current) return;
    const title=metadata?.title||(live?current.name+' Radio':current.title);
    const artist=metadata?.artist||(live?'electronicdancemusic.audio':current.artist);
    const artwork=safeUrl(metadata?.artwork)||safeUrl(current.artwork);
    $('hero-genre').textContent=live?current.name.toUpperCase()+' / LIVE RADIO':current.name.toUpperCase()+' / '+current.bpm+' BPM';
    $('hero-track').textContent=title;$('hero-artist').textContent=artist;
    $('player-title').textContent=title;$('player-subtitle').textContent=artist;
    $('player-genre').textContent=current.name.toUpperCase()+(live?' RADIO':' SESSION');
    setArtwork($('player-art'),artwork,'player');$('player-art').alt=current.name+' artwork';
    setArtwork($('phone-art'),artwork,'phone');$('phone-track').textContent=title;
    $('phone-genre').textContent=current.name.toUpperCase()+(live?' / LIVE RADIO':' / THE PREVIEW SESSIONS');
    $('phone-track').nextElementSibling.textContent=artist;
    $('player-progress-fill').style.width='0%';
    updateSavedUI();
    if('mediaSession' in navigator && typeof MediaMetadata!=='undefined') {
      try{navigator.mediaSession.metadata=new MediaMetadata({title,artist,album:live?'EDM Audio Radio':'Original Preview Sessions',artwork:artwork?[{src:artworkVariant(artwork)?.thumb||artwork}]:[]});}catch{}
    }
    document.title=(status==='playing'?title+' — ':'')+'electronicdancemusic.audio';
  }
  function stopMetadata() {clearTimeout(metadataTimer);metadataAbort?.abort();metadataAbort=null;}
  async function refreshMetadata() {
    stopMetadata();
    const url=live&&safeUrl(current?.nowPlayingUrl);
    if(!url||!wantsPlay) return;
    const stationId=current.id;
    const controller=new AbortController();metadataAbort=controller;
    const timeout=setTimeout(()=>controller.abort(),5000);
    try {
      const response=await fetch(url,{signal:controller.signal,cache:'no-store',credentials:'same-origin',headers:{Accept:'application/json'}});
      if(!response.ok)throw new Error('metadata unavailable');
      const data=await response.json();
      if(current.id===stationId&&wantsPlay&&data&&typeof data.title==='string') {
        metadata={title:data.title.slice(0,160),artist:typeof data.artist==='string'?data.artist.slice(0,160):'electronicdancemusic.audio',artwork:safeUrl(data.artwork)};
        updateStation();
      }
    } catch {} finally {
      clearTimeout(timeout);
      if(metadataAbort===controller&&wantsPlay)metadataTimer=setTimeout(refreshMetadata,25000);
    }
  }
  function toggleSaved(id) {
    if(!stations.some(s=>s.id===id)) return;
    if(saved.has(id)){saved.delete(id);announce('Removed from your saved frequencies.');}
    else{saved.add(id);announce('Frequency saved. Find it in Saved.');}
    storage.set(keys.saved,[...saved]);updateSavedUI();renderSaved();usage(saved.has(id)?'save_station':'remove_saved_station',id);
  }
  function updateSavedUI() {
    document.querySelectorAll('[data-save]').forEach(button=>{
      const station=allStations.find(s=>s.id===button.dataset.save);
      const isSaved=saved.has(button.dataset.save);
      button.setAttribute('aria-pressed',String(isSaved));
      button.setAttribute('aria-label',(isSaved?'Unsave ':'Save ')+(station?.name||'frequency'));
    });
    if(current){$('player-save').setAttribute('aria-pressed',String(saved.has(current.id)));$('player-save').setAttribute('aria-label',(saved.has(current.id)?'Unsave ':'Save ')+current.name);}
    document.querySelectorAll('.saved-count').forEach(el=>{el.textContent=saved.size;el.hidden=saved.size===0;});
  }
  function renderResults(container,items,emptyMessage) {
    container.replaceChildren();
    if(!items.length){const empty=document.createElement('p');empty.className='empty-state';empty.textContent=emptyMessage;container.append(empty);return;}
    items.forEach(station=>{
      const row=document.createElement('div');row.className='result-row';
      const play=document.createElement('button');play.type='button';play.dataset.resultStation=station.id;play.setAttribute('aria-label','Play '+station.name);
      const art=document.createElement('img');setArtwork(art,safeUrl(station.artwork),'small');art.alt='';art.width=48;art.height=48;
      const copy=document.createElement('span');const title=document.createElement('strong');title.textContent=station.name;
      const subtitle=document.createElement('small');subtitle.textContent=live?'Live radio':station.title+' · '+station.bpm+' BPM · Preview';copy.append(title,subtitle);play.append(art,copy);
      play.addEventListener('click',()=>{if(container.id==='search-results')reportSearch();closeDialogs();chooseStation(station.id,{source:container.id==='search-results'?'search':'saved'});});
      const heart=document.createElement('button');heart.type='button';heart.className='icon-button';heart.dataset.save=station.id;
      heart.innerHTML='<svg class="icon" aria-hidden="true"><use href="#i-heart"/></svg>';
      heart.addEventListener('click',()=>toggleSaved(station.id));row.append(play,heart);container.append(row);
    });updateSavedUI();
  }
  function renderSaved(){renderResults($('saved-results'),stations.filter(s=>saved.has(s.id)),'Your next favorite is out there. Tap the heart on any frequency to keep it here.');}
  let searchTimer, pendingSearchOutcome;
  function renderSearch(){
    const term=$('search-input').value.trim().toLowerCase();
    const results=stations.filter(s=>[s.name,s.title,s.description,s.keywords].join(' ').toLowerCase().includes(term));
    renderResults($('search-results'),results,'No frequencies match yet. Try house, techno, trance, or liquid.');
    return term ? results.length : null;
  }
  function reportSearch(){
    clearTimeout(searchTimer);
    if(pendingSearchOutcome)usage('search_results',null,{section:'search',source:'search',outcome:pendingSearchOutcome});
    pendingSearchOutcome=null;
  }
  function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());try { window.EDM_ANALYTICS?.view('Home'); } catch {}}
  function openDialog(id){closeDialogs();if(id==='search-dialog')usage('open_search');if(id==='saved-dialog')usage('open_library');if(id==='saved-dialog')renderSaved();if(id==='search-dialog')renderSearch();const dialog=$(id);dialog?.showModal();try { window.EDM_ANALYTICS?.view({'search-dialog':'Search','saved-dialog':'Library','privacy-dialog':'Privacy','terms-dialog':'Terms','install-dialog':'Install','about-dialog':'About','menu-dialog':'Menu'}[id] || 'Home'); } catch {} if(id==='search-dialog')$('search-input').focus();}

  const playButtonSources = ['hero','artwork','player','app_demo'];
  playButtons.forEach((button,index)=>button.addEventListener('click',()=>togglePlayback(playButtonSources[index])));
  document.querySelectorAll('[data-play]').forEach(button=>button.addEventListener('click',()=>chooseStation(button.dataset.play)));
  document.querySelectorAll('.save-button').forEach(button=>button.addEventListener('click',()=>toggleSaved(button.dataset.save)));
  $('player-save').addEventListener('click',()=>current&&toggleSaved(current.id));
  $('next-button').addEventListener('click',()=>stepStation(1));$('previous-button').addEventListener('click',()=>stepStation(-1));
  document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>openDialog(button.dataset.open)));
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>closeDialogs()));
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))try { window.EDM_ANALYTICS?.view('Home'); } catch {}}));
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));
  $('search-input').addEventListener('input',()=>{
    const count=renderSearch();
    clearTimeout(searchTimer);
    pendingSearchOutcome=null;
    if(count===null || !window.EDM_ANALYTICS?.isEnabled())return;
    pendingSearchOutcome=count===0?'no_results':count===1?'one_result':'multiple_results';
    searchTimer=setTimeout(reportSearch,600);
  });
  $('search-dialog').addEventListener('close',reportSearch);
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    const selected=button.dataset.filter;
    usage('filter_stations',selected,{section:'discover',source:'station_card'});
    document.querySelectorAll('[data-filter]').forEach(filter=>{const active=filter===button;filter.classList.toggle('active',active);filter.setAttribute('aria-pressed',String(active));});
    document.querySelectorAll('[data-channel]').forEach(card=>{card.hidden=!stations.some(s=>s.id===card.dataset.channel)||(selected!=='all'&&card.dataset.channel!==selected);});
  }));
  $('volume').addEventListener('input',event=>{audio.volume=Number(event.target.value);audio.muted=false;storage.set(keys.volume,audio.volume);updateVolume();});
  $('volume').addEventListener('change',()=>usage('control_change',null,{section:'player',control:'volume'}));
  $('mute-button').addEventListener('click',()=>{
    audio.muted=!audio.muted;
    updateVolume();
    usage('control_change',null,{section:'player',control:'mute',outcome:audio.muted||audio.volume===0?'muted':'unmuted'});
  });
  audio.addEventListener('volumechange',reportPlaybackState);
  function updateVolume(){const muted=audio.muted||audio.volume===0;icon($('mute-button'),muted?'mute':'volume');$('mute-button').setAttribute('aria-label',muted?'Unmute audio':'Mute audio');reportPlaybackState();}
  $('clear-data').addEventListener('click',()=>{
    Object.values(keys).forEach(key=>storage.remove(key));saved=new Set();audio.volume=.7;audio.muted=false;$('volume').value=.7;updateVolume();updateSavedUI();renderSaved();announce('Your saved preferences have been cleared.');
  });
  $('share-button').addEventListener('click',async()=>{
    const url=location.origin+location.pathname;usage('share_site');
    try{if(navigator.share){await navigator.share({title:'Find your frequency — electronicdancemusic.audio',text:'Electronic music. Human connection.',url});}else if(navigator.clipboard){await navigator.clipboard.writeText(url);announce('Link copied. Share the frequency.');}else{announce('Copy this page’s address to share the frequency.');}}catch(error){if(error.name!=='AbortError')announce('Copy this page’s address to share the frequency.');}
  });
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
  $('install-button').addEventListener('click',async()=>{
    const apk=androidDownload();
    if(apk){
      usage('download_app',null,{section:'app',source:'app_section',control:'android_download'});
      const link=document.createElement('a');
      link.href=apk.href;link.download=apk.filename;link.referrerPolicy='no-referrer';link.hidden=true;
      document.body.append(link);link.click();link.remove();
      announce('Download requested. Check your browser’s downloads for the Uplink APK.');return;
    }
    if(config.androidAppUrl){announce('The app download is unavailable. Please try again later.');return;}
    usage('web_app_install_opened',null,{section:'app',source:'app_section',control:'web_install'});
    const installResult=outcome=>usage('web_app_install_result',null,{section:'app',source:'app_section',control:'web_install',outcome});
    if(installPrompt){
      const prompt=installPrompt;
      installPrompt=null;
      try{
        await prompt.prompt();
        const result=await prompt.userChoice;
        const accepted=result.outcome==='accepted';
        installResult(accepted?'accepted':'dismissed');
        if(accepted)announce('Your frequency is coming to your home screen.');
      }catch{
        installResult('prompt_error');
        openDialog('install-dialog');
      }
    }else{
      installResult('manual_instructions');
      openDialog('install-dialog');
    }
  });
  window.addEventListener('appinstalled',()=>{installPrompt=null;usage('web_app_installed',null,{section:'app',control:'web_install'});announce('Your frequency is on your home screen.');});

  audio.addEventListener('playing',()=>{
    if(!wantsPlay){audio.pause();return;}
    clearTimeout(watchdogTimer);clearTimeout(retryTimer);retryTimer=null;
    clearTimeout(stableTimer);stableTimer=setTimeout(()=>{retryCount=0;},10000);
    updateState('playing');updateStation();refreshMetadata();
  });
  audio.addEventListener('pause',()=>{
    if(audio.paused&&wantsPlay&&(status==='playing'||status==='buffering')){pausePlayback();return;}
    if(!wantsPlay&&status!=='blocked'&&status!=='error')updateState('paused');
  });
  audio.addEventListener('waiting',()=>{if(wantsPlay){clearTimeout(stableTimer);updateState('buffering');setWatchdog();}});
  audio.addEventListener('stalled',()=>{if(wantsPlay&&audio.readyState<3){clearTimeout(stableTimer);updateState('buffering');setWatchdog();}});
  audio.addEventListener('error',()=>{if(wantsPlay)scheduleRetry();});
  audio.addEventListener('ended',()=>{if(live&&wantsPlay)scheduleRetry();});
  audio.addEventListener('timeupdate',()=>{
    const now=performance.now();if(now-renderProgressAt<200)return;renderProgressAt=now;
    if(!live&&Number.isFinite(audio.duration)&&audio.duration>0)$('player-progress-fill').style.width=Math.min(100,audio.currentTime/audio.duration*100)+'%';
  });
  window.addEventListener('offline',()=>{if(wantsPlay&&audio.readyState<3){clearWaiting();updateState('offline');}});
  window.addEventListener('online',()=>{if(wantsPlay&&status!=='playing'){retryCount=0;startPlayback({retrying:true});}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&wantsPlay){if(status==='error'||status==='offline')startPlayback({retrying:true});else refreshMetadata();}});
  // No global gesture listener: browsing or closing a dialog must never start music unexpectedly.
  document.addEventListener('keydown',event=>{if(event.code==='Space'&&event.target===document.body&&!document.querySelector('dialog[open]')){event.preventDefault();togglePlayback('keyboard');}});
  if('mediaSession' in navigator) {
    const handlers={play:()=>startPlayback({source:'media_controls'}),pause:pausePlayback,stop:pausePlayback,nexttrack:()=>stepStation(1,'media_controls'),previoustrack:()=>stepStation(-1,'media_controls')};
    Object.entries(handlers).forEach(([action,handler])=>{try{navigator.mediaSession.setActionHandler(action,handler);}catch{}});
  }
  if('serviceWorker' in navigator&&window.isSecureContext) {
    window.addEventListener('load',()=>{const register=()=>navigator.serviceWorker.register('./sw.js').catch(()=>{});if('requestIdleCallback' in window)requestIdleCallback(register,{timeout:5000});else setTimeout(register,500);});
  }
  function applyConfig() {
    document.querySelector('[data-filter="all"] span').textContent=String(stations.length).padStart(2,'0');
    for(const card of document.querySelectorAll('[data-channel]')) {
      const station=stations.find(s=>s.id===card.dataset.channel);card.hidden=!station;
      const filter=document.querySelector('[data-filter="'+card.dataset.channel+'"]');if(filter)filter.hidden=!station;
      if(station){card.querySelector('h3').textContent=station.name;card.querySelector(':scope > p')?.replaceChildren(document.createTextNode(station.description||''));setArtwork(card.querySelector('.cover-play img'),safeUrl(station.artwork),'card');if(live){card.querySelector('.preview-label').textContent='LIVE RADIO';card.querySelector('.channel-title>span').textContent='LIVE';}}
    }
    if(live){$('hero-mode').textContent='THE LIVE FREQUENCIES';$('mode-badge').lastChild.textContent='LIVE';$('preview-disclosure').hidden=true;$('footer-preview').textContent='ELECTRONICDANCEMUSIC.AUDIO · 2026';}
    const apk=androidDownload();
    if(apk){$('install-button').innerHTML='<svg class="icon"><use href="#i-phone"/></svg>Download Android app <svg class="icon arrow"><use href="#i-download"/></svg>';document.querySelector('.app-availability').textContent='Uplink Listener beta '+apk.version+' · Android 8 or newer.';}
    $('next-button').hidden=stations.length<2;$('previous-button').hidden=stations.length<2;
  }
  applyConfig();updateVolume();updateStation();updateState(current?'ready':'unavailable');
  if(config.autoStart&&current)startPlayback({autoplay:true});
})();
