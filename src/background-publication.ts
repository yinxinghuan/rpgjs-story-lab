import {getGameApiBase} from './game-id'
export const BACKGROUND_CHECKS=['starter','brakes','fuel-shed','departure-control','collision'] as const
export const BACKGROUND_LAYOUT='original-train-authoring-2'
export type BackgroundReview={sha256:string;layout:typeof BACKGROUND_LAYOUT;checks:string[];visualAccepted:true}
export type PublishedBackground={version:1;id:string;scene:'train-at-dead-station';sha256:string;bytes:number;width:1024;height:1536;review:BackgroundReview}
export const backgroundReleaseId=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}\.[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v)
export function assertBackgroundReview(value:any,sha:string):asserts value is BackgroundReview{
 if(!value||Object.keys(value).sort().join(',')!=='checks,layout,sha256,visualAccepted'||value.sha256!==sha||value.layout!==BACKGROUND_LAYOUT||value.visualAccepted!==true||!Array.isArray(value.checks)||value.checks.length!==BACKGROUND_CHECKS.length||BACKGROUND_CHECKS.some(id=>!value.checks.includes(id)))throw Error('BACKGROUND_REVIEW_REQUIRED')
}
export function assertPublishedBackground(v:any):asserts v is PublishedBackground{
 if(!v||Object.keys(v).sort().join(',')!=='bytes,height,id,review,scene,sha256,version,width'||v.version!==1||!backgroundReleaseId(v.id)||v.scene!=='train-at-dead-station'||!/^[a-f0-9]{64}$/.test(v.sha256)||v.width!==1024||v.height!==1536||!Number.isSafeInteger(v.bytes)||v.bytes<45||v.bytes>8*1024*1024)throw Error('BACKGROUND_RELEASE_INVALID')
 assertBackgroundReview(v.review,v.sha256)
}
export function backgroundReleasePath(id:string){if(!backgroundReleaseId(id))throw Error('BACKGROUND_RELEASE_INVALID');return getGameApiBase()+'/api/creator/releases/'+id}
