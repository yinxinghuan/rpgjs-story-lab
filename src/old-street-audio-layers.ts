/** Ambient tracks never own gameplay state. Playback failures remain silent and retry on a gesture. */
export class OldStreetAudioLayers{
 private unlocked=false
 private enabled=true
 private visible=true
 private river=false
 private disposed=false
 private tracks:Array<{element:HTMLAudioElement;volume:number;riverOnly:boolean}>
 constructor(music:string,ambience:string,create:(url:string)=>HTMLAudioElement=url=>new Audio(url)){
  this.tracks=[{element:create(music),volume:.32,riverOnly:false},{element:create(ambience),volume:.55,riverOnly:true}]
  for(const {element,volume} of this.tracks){element.loop=true;element.preload='none';element.volume=volume}
 }
 unlock(){this.unlocked=true;this.sync()}
 setEnabled(value:boolean){this.enabled=value;this.sync()}
 setVisible(value:boolean){this.visible=value;this.sync()}
 setScene(scene:string){this.river=scene==='shed';this.sync()}
 private sync(){
  for(const track of this.tracks){
   const shouldPlay=()=>!this.disposed&&this.enabled&&this.visible&&this.unlocked&&(!track.riverOnly||this.river)
   if(!shouldPlay()){track.element.pause();continue}
   if(!track.element.paused)continue
   try{void track.element.play().then(()=>{if(!shouldPlay())track.element.pause()}).catch(()=>{})}catch{}
  }
 }
 dispose(){this.disposed=true;for(const {element} of this.tracks){element.pause();element.removeAttribute('src');element.load()}}
}
