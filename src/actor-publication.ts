import {getGameApiBase} from './game-id'
import {backgroundReleaseId} from './background-publication'
import {assertActorMapReview,type ActorMapReview} from './actor-map-review'
export type PublishedActor={version:1;id:string;slot:'ada-mechanic';sha256:string;bytes:number;width:number;height:number;foot:{x:number;y:number};review:ActorMapReview}
export const actorReleaseId=backgroundReleaseId
const invalid=()=>{throw Error('ACTOR_RELEASE_INVALID')}
export function assertPublishedActor(v:any):asserts v is PublishedActor{
 if(!v||Object.keys(v).sort().join(',')!=='bytes,foot,height,id,review,sha256,slot,version,width'||v.version!==1||!actorReleaseId(v.id)||v.slot!=='ada-mechanic'||typeof v.sha256!=='string'||!/^[a-f0-9]{64}$/.test(v.sha256)||!Number.isInteger(v.bytes)||v.bytes<45||v.bytes>8*1024*1024||!Number.isInteger(v.width)||!Number.isInteger(v.height)||v.width<12||v.height<16||v.width>1536||v.height>1536||v.width*v.height>1572864||v.width%3||v.height%4)return invalid()
 const cw=v.width/3,ch=v.height/4,f=v.foot
 if(!f||Object.keys(f).sort().join(',')!=='x,y'||!Number.isInteger(f.x)||!Number.isInteger(f.y)||f.x<0||f.x>=cw||f.y<4||f.y>=ch)return invalid()
 assertActorMapReview(v.review,{spec:{cellWidth:cw,cellHeight:ch,foot:f}})
 if(v.review.bounds.some((b:number[])=>f.x<b[0]||f.x>b[2]||(b[2]-b[0])*v.review.scale>40||Math.max(0,b[3]-f.y)*v.review.scale>4))return invalid()
}
export function actorReleasePath(id:string){if(!actorReleaseId(id))return invalid();return getGameApiBase()+'/api/creator/actor-releases/'+id}
