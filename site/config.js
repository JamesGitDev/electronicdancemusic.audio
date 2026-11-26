// Public listener configuration only. Never put Uplink admin credentials or origin IPs here.
window.EDM_CONFIG = {
  liveMode: false,
  autoStart: false,
  androidAppUrl: 'https://electronicdancemusic.audio/downloads/Uplink-Listener-0.3.16-rc8.apk',
  stations: [
    {id:'house',name:'House',title:'Afterglow',artist:'The EDM Audio Sessions',bpm:124,description:'Warm bass. Soulful edges. Endless movement.',keywords:'groove soulful warm drive sunset',artwork:'./assets/house.webp',previewUrl:'./assets/audio/house.mp3',streamUrl:'',nowPlayingUrl:''},
    {id:'techno',name:'Techno',title:'Night Signal',artist:'The EDM Audio Sessions',bpm:130,description:'Deep focus. Dark rooms. Pure momentum.',keywords:'dark night underground focus warehouse',artwork:'./assets/techno.webp',previewUrl:'./assets/audio/techno.mp3',streamUrl:'',nowPlayingUrl:''},
    {id:'trance',name:'Trance',title:'Higher Ground',artist:'The EDM Audio Sessions',bpm:136,description:'Eyes closed. Melodies wide open.',keywords:'melodic uplifting spacious clouds flow',artwork:'./assets/trance.webp',previewUrl:'./assets/audio/trance.mp3',streamUrl:'',nowPlayingUrl:''},
    {id:'dnb',name:'Drum & bass',title:'Blue Hour',artist:'The EDM Audio Sessions',bpm:172,description:'Liquid textures. A restless heartbeat.',keywords:'dnb liquid fast running blue energetic',artwork:'./assets/dnb.webp',previewUrl:'./assets/audio/dnb.mp3',streamUrl:'',nowPlayingUrl:''}
  ]
};
