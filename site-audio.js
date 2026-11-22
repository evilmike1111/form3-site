/* FORM3 audio 84: music lives outside route renders. Music starts after first gesture; no recording. */
(()=>{
 'use strict';
 if(window.FORM3_MUSIC)return;
 const sources={grief:'assets/audio/Dignified-Grief-recorded.mp3',glass:'assets/audio/Glass-Lattice-recorded.mp3',sliver:'assets/audio/A-Sliver-of-Light.mp3',fantasy:'assets/audio/Kieru-Gensou-recorded.mp3',...(window.FORM3_MUSIC_ASSETS||{global:'assets/audio/Spatial-Flow-norm.mp3',works:'assets/audio/Untitled-norm.mp3'})};
 const read=(k,f)=>{try{return localStorage.getItem(k)??f}catch{return f}};
 const write=(k,v)=>{try{localStorage.setItem(k,String(v))}catch{}};
 try{if(localStorage.getItem('form3.music.reset')!=='1120a'){localStorage.removeItem('form3.music.enabled');localStorage.removeItem('form3.music.volume');localStorage.setItem('form3.music.reset','1120a')}}catch(e){}
 let enabled=read('form3.music.enabled','true')!=='false',unlocked=false,failed=false,volume=Math.max(0,Math.min(1,Number(read('form3.music.volume','.5'))||0)),duck=1,revision=0;
 const tracks={},history=[];
 for(const name of ['global','works','fantasy','grief','glass','sliver']){
  const audio=new Audio();audio.preload='none';audio.loop=true;audio.src=sources[name];audio.volume=0;
  tracks[name]={audio,level:0};
  audio.addEventListener('error',()=>{failed=true;paint()});
  audio.addEventListener('ended',()=>{if(selection!=='auto'||name!==current)return;const order=['global','works','fantasy','grief','glass','sliver'];autoNext=order[(order.indexOf(name)+1)%order.length];try{audio.currentTime=0}catch(e){}history.push({event:'auto-next',track:autoNext,time:performance.now()});playSelected()});
 }
 const route=()=>location.hash.match(/^#\/([a-z]+)/)?.[1]||document.body.dataset.page||'home';
 let selection=read('form3.music.selection','auto');if(!['auto','fantasy','grief','glass'].includes(selection))selection='auto';
 /* FORM3-380: in auto mode a finished track advances to the next one; a manually chosen track still loops */
 const base=()=>route()==='works'?'works':'global';let autoNext=null,lastBase=null;
 const wanted=()=>{if(selection!=='auto')return selection;const b=base();if(b!==lastBase){lastBase=b;autoNext=null}return autoNext||b};
 const syncLoop=()=>{for(const t of Object.values(tracks))t.audio.loop=selection!=='auto'};syncLoop();
 const zh=()=>document.documentElement.lang!=='en';
 const box=document.createElement('aside');box.id='form3Music';box.setAttribute('aria-label','FORM³ 背景音樂');
 box.innerHTML='<button type="button" id="form3SoundLauncher" aria-expanded="false" aria-controls="form3SoundOptions" aria-label="聲音設定" title="聲音設定">♫</button><div id="form3SoundOptions" hidden><p class="sound-heading"></p><button type="button" id="form3MusicToggle" aria-pressed="false"></button><label><span class="volume-label">音量</span><input type="range" id="form3MusicVolume" min="0" max="100" step="1" aria-label="背景音樂音量"></label><label><span class="track-label">曲目</span><select id="form3MusicTrack" aria-label="背景音樂曲目"><option value="auto">依頁面自動切換</option><option value="fantasy">消える幻想</option><option value="grief">Dignified Grief</option><option value="glass">Glass Lattice</option><option value="sliver">光隙</option></select></label><span class="music-state" role="status" aria-live="polite"></span></div>';
 document.body.append(box);
 const launcher=box.querySelector('#form3SoundLauncher'),options=box.querySelector('#form3SoundOptions'),toggle=box.querySelector('#form3MusicToggle'),slider=box.querySelector('input'),status=box.querySelector('.music-state');slider.value=String(Math.round(volume*100));
 const trackSelect=box.querySelector('#form3MusicTrack');trackSelect.value=selection;
 trackSelect.addEventListener('change',()=>{autoNext=null;selection=trackSelect.value;write('form3.music.selection',selection);current=wanted();failed=false;if(enabled&&unlocked)playSelected();else paint();});
 const soundControl=document.querySelector('#navSoundToggle');if(soundControl)options.append(soundControl);
 function closeOptions(){options.hidden=true;launcher.setAttribute('aria-expanded','false');}
 launcher.addEventListener('click',()=>{options.hidden=!options.hidden;launcher.setAttribute('aria-expanded',String(!options.hidden));});
 box.addEventListener('keydown',e=>{if(e.key==='Escape'&&!options.hidden){closeOptions();launcher.focus();}});
 document.addEventListener('click',e=>{if(!box.contains(e.target))closeOptions();});
 window.addEventListener('hashchange',closeOptions);
 let current=wanted(),transition=0;const quiet=()=>route()==='music';/* FORM3-193: the music page has its own player, so background music stays silent there */
 function paint(){box.hidden=quiet();box.querySelector('.track-label').textContent=zh()?'曲目':'Track';trackSelect.setAttribute('aria-label',zh()?'背景音樂曲目':'Music track');trackSelect.options[0].textContent=zh()?'依頁面自動切換':'Follow page';toggle.textContent=zh()?(enabled?'音樂：開':'音樂：關'):(enabled?'Music: on':'Music: off');launcher.setAttribute('aria-label',zh()?'聲音設定':'Sound settings');launcher.title=zh()?'聲音設定':'Sound settings';box.querySelector('.sound-heading').textContent=zh()?'聲音設定':'Sound settings';box.querySelector('.volume-label').textContent=zh()?'音樂音量':'Music volume';slider.setAttribute('aria-label',zh()?'背景音樂音量':'Music volume');toggle.setAttribute('aria-pressed',String(enabled));box.classList.toggle('needs-tap',!!enabled&&!unlocked);box.dataset.tip=zh()?'\u9ede\u4e00\u4e0b\u9801\u9762\uff0c\u958b\u555f\u97f3\u6a02':'Click anywhere to start the music';status.textContent=enabled&&!unlocked?(zh()?'點一下頁面啟用音樂':'Tap the page to start music'):failed?(zh()?'音訊未啟動，請重試':'Audio unavailable — retry'):enabled?(current==='grief'?'Dignified Grief':current==='glass'?'Glass Lattice':current==='sliver'?'光隙':current==='fantasy'?'消える幻想':current==='works'?'Untitled':'Spatial Flow'):'';}
 function animate(){cancelAnimationFrame(transition);const started=performance.now(),initial=Object.fromEntries(Object.entries(tracks).map(([k,v])=>[k,v.level]));
  function frame(now){const u=Math.min(1,(now-started)/900),ease=u*u*(3-2*u);for(const [name,t]of Object.entries(tracks)){const target=enabled&&!document.hidden&&!quiet()&&name===current?1:0;t.level=initial[name]+(target-initial[name])*ease;t.audio.volume=Math.max(0,Math.min(1,t.level*volume*duck));if(u===1&&t.level===0)t.audio.pause();}if(u<1)transition=requestAnimationFrame(frame);}
  transition=requestAnimationFrame(frame);
 }
 async function playSelected(){const token=++revision;syncLoop();current=wanted();paint();if(!enabled||document.hidden||quiet()){animate();return;}
  try{await tracks[current].audio.play();if(token!==revision){if(current!==wanted())switchRoute();return;}failed=false;history.push({event:'play',track:current,time:performance.now()});animate();paint();}
  catch{if(token!==revision)return;failed=true;unlocked=false;animate();paint();}
 }
 function switchRoute(){const next=wanted();if(next===current){paint();return;}current=next;history.push({event:'route',track:current,time:performance.now()});playSelected();}
 toggle.addEventListener('click',()=>{unlocked=true;enabled=!enabled;write('form3.music.enabled',enabled);failed=false;playSelected()});
 function firstGesture(event){if(unlocked||!enabled||!event.isTrusted)return;if(event.type==='keydown'&&(!['Enter',' '].includes(event.key)||event.target.matches?.('input,textarea,select,[contenteditable=true]')))return;if(event.target.closest?.('#form3MusicToggle'))return;unlocked=true;failed=false;playSelected();}
 document.addEventListener('pointerdown',firstGesture,{passive:true});document.addEventListener('pointerup',firstGesture,{passive:true});document.addEventListener('click',firstGesture,{passive:true});
 document.addEventListener('keydown',firstGesture);

 slider.addEventListener('input',()=>{volume=Number(slider.value)/100;write('form3.music.volume',volume);for(const t of Object.values(tracks))t.audio.volume=t.level*volume*duck;});
 window.addEventListener('hashchange',switchRoute);
 new MutationObserver(()=>{switchRoute();paint()}).observe(document.querySelector('#app')||document.body,{childList:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){revision++;for(const t of Object.values(tracks))t.audio.pause();}else if(enabled&&unlocked)playSelected();});
 window.addEventListener('pagehide',()=>{revision++;cancelAnimationFrame(transition);for(const t of Object.values(tracks))t.audio.pause()});
 paint();if(enabled&&!document.hidden&&!quiet()){try{const a0=tracks[current].audio;a0.play().then(()=>{if(!unlocked){unlocked=true;failed=false;history.push({event:'autoplay',track:current,time:performance.now()});animate();paint()}}).catch(()=>{})}catch(e){}}
 /* FORM3-189: entry gate - one click both enters the site and satisfies the browser's sound rule */
 setTimeout(()=>{try{if(true)return;/* gate disabled 2026-11-15: owner wants the home page on open */if(unlocked||!enabled||sessionStorage.getItem('form3.gate'))return;const g=document.createElement('div');g.id='form3Gate';g.setAttribute('role','dialog');g.setAttribute('aria-modal','true');g.innerHTML='<div class="gate-card"><div class="gate-mark">FORM\u00b3</div><p class="gate-line"></p><button type="button" class="gate-enter"></button><button type="button" class="gate-mute"></button></div>';document.body.append(g);document.documentElement.classList.add('form3-gated');const L=()=>{g.querySelector('.gate-line').textContent=zh()?'\u6578\u4f4d\u5de5\u5177 \u00d7 \u6578\u4f4d\u5275\u4f5c\u5de5\u4f5c\u5ba4 \u00d7 \u8996\u89ba\u8868\u73fe':'Digital Tools \u00b7 Creative Studio \u00b7 Visual Expression';g.querySelector('.gate-enter').textContent=zh()?'\u9032\u5165\u7db2\u7ad9\u3000\u266a':'Enter  \u266a';g.querySelector('.gate-mute').textContent=zh()?'\u975c\u97f3\u9032\u5165':'Enter without sound'};L();const done=()=>{try{sessionStorage.setItem('form3.gate','1')}catch(e){}g.classList.add('out');document.documentElement.classList.remove('form3-gated');setTimeout(()=>g.remove(),450)};g.querySelector('.gate-enter').addEventListener('click',done);g.querySelector('.gate-mute').addEventListener('click',()=>{unlocked=true;enabled=false;write('form3.music.enabled',false);paint();animate();done()});g.querySelector('.gate-enter').focus()}catch(e){}},700);
  window.FORM3_MUSIC={state:()=>({enabled,unlocked,current,volume,duck,failed,tracks:Object.fromEntries(Object.entries(tracks).map(([k,t])=>[k,{paused:t.audio.paused,time:t.audio.currentTime,volume:t.audio.volume,loop:t.audio.loop,ready:t.audio.readyState}])),history:history.slice(-20)}),duck:v=>{duck=Math.max(0,Math.min(1,v));animate()}};

 // 109: V03 follows the explorer clock only; automatic presentation stays silent.
 const explorer=new Audio(window.FORM3_EXPLORER_ASSET||'assets/audio/FORM3-interactive-V03.mp3');
 explorer.preload='metadata';explorer.volume=.8;
 let explorerUnlocked=false,explorerActive=false,explorerStarting=false,explorerToken=0,explorerError=null;
 function stopExplorer(reset=false){explorerToken++;explorerStarting=false;explorer.pause();if(reset&&explorer.readyState)explorer.currentTime=0;if(explorerActive){explorerActive=false;duck=1;animate();}}
 function syncExplorer(){
  let state=null;try{state=document.querySelector('#heroFrame')?.contentWindow?.FORM3?.getState()}catch{}
  const muted=window.FORM3_NAV_FEEDBACK?.state().muted===true;
  const active=explorerUnlocked&&state?.interactionMode&&!state.awaitingSelection&&state.running&&state.inViewport&&!document.hidden&&!muted;
  if(!active){stopExplorer(!state?.interactionMode||state.awaitingSelection);return;}
  if(!explorerActive){explorerActive=true;duck=.7;animate();}
  explorer.playbackRate=state.speed||1;
  if(explorer.readyState&&Math.abs(explorer.currentTime-state.time)>.25)explorer.currentTime=Math.min(state.time,explorer.duration||50);
  if(explorer.paused&&!explorerStarting){explorerStarting=true;const token=++explorerToken;explorer.play().then(()=>{if(token!==explorerToken)explorer.pause();else explorerError=null;}).catch(e=>{explorerError=e.name;stopExplorer();}).finally(()=>{if(token===explorerToken)explorerStarting=false;});}
 }
 window.addEventListener('message',event=>{const f=document.querySelector('#heroFrame');if(!f||event.source!==f.contentWindow||event.data?.type!=='FORM3_EXPLORER_GESTURE')return;explorerUnlocked=true;if(enabled&&!unlocked){unlocked=true;playSelected();}setTimeout(syncExplorer,0);});
 let explorerTimer=setInterval(syncExplorer,80);
 window.addEventListener('pageshow',()=>{clearInterval(explorerTimer);explorerTimer=setInterval(syncExplorer,80);syncExplorer();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopExplorer();else syncExplorer();});
 window.addEventListener('hashchange',()=>stopExplorer(true));
 window.addEventListener('pagehide',()=>{clearInterval(explorerTimer);stopExplorer(true)});
 window.FORM3_EXPLORER_AUDIO={state:()=>({preset:'V03',active:explorerActive,unlocked:explorerUnlocked,paused:explorer.paused,time:explorer.currentTime,volume:explorer.volume,error:explorerError,duckFactor:.7})};
})();
