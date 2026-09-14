import {advanceRoute,STRIDE_DISTANCE,walkingPose,WALK_SPEED} from './walking-motion'

export type CompanionPoint={x:number;y:number}
export type CompanionState={id:string;position:CompanionPoint;direction:'up'|'down'|'left'|'right';pose:string}
type Walker=CompanionState&{route:CompanionPoint[];stride:number;repath:number;yieldTo?:CompanionPoint;yieldIdle?:number}
const distance=(a:CompanionPoint,b:CompanionPoint)=>Math.hypot(a.x-b.x,a.y-b.y)
const face=(a:CompanionPoint,b:CompanionPoint):CompanionState['direction']=>Math.abs(b.x-a.x)>Math.abs(b.y-a.y)?b.x>a.x?'right':'left':b.y>a.y?'down':'up'

/** Local single-player choreography. Never changes party membership or story state.
 * Positions use the same coordinate space and collision predicate as the leader. */
export class CompanionMotion {
 private trail:CompanionPoint[]=[]
 private walkers:Walker[]=[]
 private needsReset=false
 constructor(private spacing=34,private separation=16){}
 reset(leader:CompanionPoint,members:readonly {id:string;position:CompanionPoint}[]){
  this.trail=[{...leader}]
  this.needsReset=false
  this.walkers=members.map(m=>({...m,position:{...m.position},direction:'down',pose:'stand',route:[],stride:0,repath:0}))
 }
 snapshot():CompanionState[]{return this.walkers.map(({id,position,direction,pose})=>({id,position:{...position},direction,pose}))}
 private target(offset:number){
  for(let i=this.trail.length-1;i>0;i--){const a=this.trail[i],b=this.trail[i-1],d=distance(a,b);if(d>=offset){const t=d?offset/d:0;return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}}offset-=d}
  return {...this.trail[0]}
 }
 update(dt:number,leader:CompanionPoint,options:{paused:boolean;talkingTo?:string;workPosts?:Record<string,CompanionPoint>;leaderIntent?:CompanionPoint;walkable:(p:CompanionPoint)=>boolean;findPath:(a:CompanionPoint,b:CompanionPoint)=>CompanionPoint[]}):CompanionState[]{
  if(!this.trail.length)return []
  if(this.needsReset)return this.snapshot()
  const previous=this.trail[this.trail.length-1]
  // A scene restore must explicitly reset the formation; never chase a teleport.
  if(distance(previous,leader)>96){this.needsReset=true;for(const w of this.walkers){w.route=[];w.pose='stand'}return this.snapshot()}
  if(distance(previous,leader)>=2){this.trail.push({...leader});if(this.trail.length>1024)this.trail.shift()}
  const stopped=options.paused||!Number.isFinite(dt)||dt<=0||dt>.25
  for(const [index,w] of this.walkers.entries()){
   if(stopped||options.talkingTo===w.id){w.pose='stand';if(options.talkingTo===w.id&&distance(w.position,leader)>1)w.direction=face(w.position,leader);continue}
   const intent=options.leaderIntent??{x:0,y:0},length=Math.hypot(intent.x,intent.y),u=length?{x:intent.x/length,y:intent.y/length}:{x:0,y:0}
   const dx=w.position.x-leader.x,dy=w.position.y-leader.y,along=dx*u.x+dy*u.y,across=Math.abs(dx*u.y-dy*u.x)
   if(w.yieldTo){w.yieldIdle=length>.01?0:(w.yieldIdle??0)+dt;if(along< -8||(w.yieldIdle??0)>.6||(length>.01&&distance(w.position,w.yieldTo)<3&&across<this.separation+6&&along>0&&along<56)){w.yieldTo=undefined;w.route=[];w.repath=0}}
   if(!w.yieldTo&&length>.01&&along>0&&along<56&&across<this.separation+6){
    const other=this.walkers.filter(a=>a!==w)
    const candidates=[{x:w.position.x-u.y*28,y:w.position.y+u.x*28},{x:w.position.x+u.y*28,y:w.position.y-u.x*28},{x:w.position.x+u.x*32,y:w.position.y+u.y*32}]
    for(const candidate of candidates){if(!options.walkable(candidate)||other.some(a=>distance(a.position,candidate)<this.separation))continue;const route=options.findPath(w.position,candidate);if(!route.length)continue;w.yieldTo=candidate;w.yieldIdle=0;w.route=route;w.repath=0;break}
   }
   const post=options.workPosts?.[w.id],goal=w.yieldTo??post??this.target(this.spacing*(index+1))
   if(distance(w.position,goal)<3||!post&&!w.yieldTo&&distance(w.position,leader)<this.spacing*.8){w.pose='stand';w.route=[];w.repath=0;continue}
   w.repath-=dt
   if(w.repath<=0||!w.route.length){w.route=options.findPath(w.position,goal);if(w.route.length>1&&distance(w.position,w.route[0])<3)w.route.shift();w.repath=.3}
   const occupied=[leader,...this.walkers.filter(other=>other!==w).map(other=>other.position)]
   const result=advanceRoute(w.position,w.route,WALK_SPEED*dt,p=>options.walkable(p)&&occupied.every(other=>distance(p,other)>=Math.min(this.separation,distance(w.position,other))-1e-7&&!(p.x+9>other.x&&p.x<other.x+9&&p.y+15>other.y&&p.y<other.y+15)))
   w.route.splice(0,result.consumed)
   if(result.blocked){w.route=[];w.repath=0}
   if(result.distance>1e-7){w.direction=face(w.position,result.position);w.position=result.position;w.stride=(w.stride+result.distance)%STRIDE_DISTANCE;w.pose=walkingPose(w.stride)}else w.pose='stand'
  }
  return this.snapshot()
 }
}
