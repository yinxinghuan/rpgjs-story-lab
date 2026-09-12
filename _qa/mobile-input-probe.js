// Run only in the local production-build test page, via browser DevTools.
// Native CUA has already checked pointer capture outside the joystick bounds.
// Its drag collapses move/up into one frame; these synthetic held events verify
// sustained movement, cancellation and the real renderer, not iPhone hardware.
// Stop reads allow React to paint the already-reported last renderer frame;
// DOM attributes can lag the synchronous input release by one frame.
(async()=>{
 const game=document.querySelector('.og-game'),stick=document.querySelector('.og-joystick'),map=document.querySelector('.og-map')
 if(!game||game.dataset.ready!=='true'||stick.disabled||document.querySelector('.og-sheet'))throw Error('QA_GAME_NOT_IDLE')
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),point=()=>({x:Number(game.dataset.playerX),y:Number(game.dataset.playerY)})
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),capture=stick.setPointerCapture
 const send=(type,x=0,y=0)=>{const r=stick.getBoundingClientRect();stick.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:919,button:0,buttons:type==='pointerup'?0:1,pointerType:'touch',clientX:r.x+r.width/2+x,clientY:r.y+r.height/2+y}))}
 const down=(x,y)=>{
  // A synthetic pointer has no OS capture record. Only bypass capture lookup
  // for its down event; production capture and all React handlers stay intact.
  stick.setPointerCapture=()=>{}
  try{send('pointerdown',x,y)}finally{stick.setPointerCapture=capture}
 }
 const walk=(x,y)=>{const r=map.getBoundingClientRect();map.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+(x+4.5)*r.width/384,clientY:r.top+(y+15)*r.height/576}))}
 const dx=point().x<180?1:-1,results={viewport:{width:innerWidth,height:innerHeight,mapWidth:map.clientWidth}},assert=(yes,message)=>{if(!yes)throw Error(message)}
 try{
  const start=point();down(24*dx,0);await wait(650);const moved=point();send('pointerup');await wait(80);const stopped=point();await wait(250)
  results.hold={start,moved,stopped,after:point()};assert(distance(start,moved)>20,'QA_HELD_STICK_DID_NOT_MOVE');assert(distance(moved,stopped)<6&&distance(stopped,point())<.2,'QA_RELEASE_DID_NOT_STOP')
  walk(stopped.x+45*dx,stopped.y);await wait(180);const routed=point();assert(distance(stopped,routed)>1,'QA_CLICK_DID_NOT_MOVE')
  down(-24*dx,0);await wait(400);send('pointerup');await wait(80);const taken=point();await wait(250)
  results.takeover={routed,taken,stopped:point(),destination:!!document.querySelector('.og-destination')}
  assert((taken.x-routed.x)*dx<-8,'QA_STICK_DID_NOT_TAKE_OVER');assert(!results.takeover.destination&&distance(taken,point())<.2,'QA_OLD_ROUTE_RESUMED')
  down(0,24);await wait(120);document.querySelector('.og-footer nav button').click();await wait(80)
  assert(stick.disabled,'QA_PANEL_DID_NOT_DISABLE_STICK');const paused=point()
  document.querySelector('.og-sheet header button').click();await wait(80);send('pointermove',0,24);await wait(250)
  results.panel={paused,after:point()};assert(distance(paused,point())<.2,'QA_OLD_TOUCH_RESUMED_AFTER_PANEL')
  down(24*dx,0);await wait(100);window.dispatchEvent(new Event('blur'));await wait(80);const blurred=point();await wait(250)
  results.blur={blurred,after:point()};assert(distance(blurred,point())<.2,'QA_BLUR_DID_NOT_STOP')
  results.passed=true
 }catch(error){results.passed=false;results.error=String(error)}finally{send('pointercancel');stick.setPointerCapture=capture}
 window.__mobileInputResult=results
 return results
})()
