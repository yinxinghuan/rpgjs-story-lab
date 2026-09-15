type Point={x:number;y:number}
export type StreetCue='stone'|'wood'|'handle'|'pickup'
/** Distance sampling excludes restores and scene changes, never catches up in bursts. */
export class StreetFootsteps{
 private last?:Point
 private room=''
 private distance=0
 private elapsed=0
 update(dt:number,point:Point,room:string,paused:boolean):StreetCue|undefined{
  const previous=this.last;this.last={...point}
  if(this.room!==room||paused||!previous||!Number.isFinite(dt)||dt<=0||dt>.25){this.room=room;this.distance=0;this.elapsed=0;return}
  const moved=Math.hypot(point.x-previous.x,point.y-previous.y)
  if(!Number.isFinite(moved)||moved>30){this.distance=0;return}
  this.elapsed+=dt
  if(moved<.01){this.distance=0;return}
  this.distance+=moved
  if(this.distance<28||this.elapsed<.12)return
  this.distance%=28;this.elapsed=0
  return ['shop','photo','shed','darkroom'].includes(room)?'wood':'stone'
 }
}
/** Quiet synthesized foley; no downloads, autoplay or dependency on audio success. */
export class OldStreetAudio{
 private context?:AudioContext
 private active=new Set<OscillatorNode>()
 enabled=true
 unlock(){
  if(!this.enabled)return
  try{this.context??=new AudioContext();if(this.context.state!=='running'&&this.context.state!=='closed')void this.context.resume().catch(()=>{})}catch{}
 }
 setEnabled(value:boolean){this.enabled=value;if(!value){for(const node of this.active){try{node.stop()}catch{}}this.active.clear()}}
 play(cue:StreetCue){
  const ctx=this.context;if(!this.enabled||!ctx||ctx.state!=='running'||this.active.size>=4)return
  try{
   const spec={stone:[165,85,.055,.028],wood:[105,65,.08,.035],handle:[320,110,.16,.028],pickup:[660,880,.12,.025]}[cue]
   const [from,to,duration,volume]=spec,node=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime
   node.type=cue==='pickup'?'sine':'triangle';node.frequency.setValueAtTime(from,now);node.frequency.exponentialRampToValueAtTime(to,now+duration)
   gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+duration)
   node.connect(gain);gain.connect(ctx.destination);this.active.add(node)
   node.onended=()=>{this.active.delete(node);node.disconnect();gain.disconnect()};node.start();node.stop(now+duration+.01)
  }catch{}
 }
 dispose(){this.setEnabled(false);void this.context?.close().catch(()=>{});this.context=undefined}
}
