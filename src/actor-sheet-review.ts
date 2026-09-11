import {verifySpritePng,type SpriteDraft,type SpriteDraftRepository,type SpritePng} from './sprite-draft'
import {assertActorMapReview,type ActorMapReview} from './actor-map-review'
import {inspectActorMapCandidate,type ActorPreview} from './sprite-map-candidate'
import type {PixelRaster} from './sprite-preparation'

export const ACTOR_DIRECTIONS=['down','left','right','up'] as const
export const ACTOR_ROW_CHECKS=['facing','alternatingSteps','attachments'] as const
export type ActorDirection=typeof ACTOR_DIRECTIONS[number]
export type ActorVerdict='unchecked'|'pass'|'fail'
export type ActorAnswers=Record<ActorDirection,Record<typeof ACTOR_ROW_CHECKS[number],ActorVerdict>>
export type ActorSheetReview={version:1;draftId:string;sourceSha256:string;candidateSha256:string;preparation:string;recordedAt:number;answers:ActorAnswers;map?:ActorMapReview}
export type ActorReviewTarget=Pick<SpriteDraft,'id'|'state'|'spec'|'deviceStateSet'|'composition'> & {source:Pick<SpritePng,'sha256'>;result?:Pick<NonNullable<SpriteDraft['result']>,'frames'|'algorithm'> & {png:Pick<SpritePng,'sha256'>}}
const invalid=()=>{throw Error('SPRITE_ACTOR_REVIEW_INVALID')}
export function emptyActorAnswers():ActorAnswers{
 return Object.fromEntries(ACTOR_DIRECTIONS.map(d=>[d,Object.fromEntries(ACTOR_ROW_CHECKS.map(c=>[c,'unchecked']))])) as ActorAnswers
}
function assertAnswers(a:any):asserts a is ActorAnswers{
 if(!a||Object.keys(a).sort().join(',')!==[...ACTOR_DIRECTIONS].sort().join(','))return invalid()
 for(const d of ACTOR_DIRECTIONS){const row=a[d];if(!row||Object.keys(row).sort().join(',')!==[...ACTOR_ROW_CHECKS].sort().join(',')||ACTOR_ROW_CHECKS.some(c=>!['unchecked','pass','fail'].includes(row[c])))return invalid()}
}
function binding(d:ActorReviewTarget){
 if(d.state!=='candidate'||!d.result||!d.spec||d.spec.kind!=='actor'||d.spec.columns!==3||d.spec.rows!==4||d.result.frames.length!==12||d.deviceStateSet||d.composition)return invalid()
 const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v
 return {draftId:d.id,sourceSha256:d.source.sha256,candidateSha256:d.result.png.sha256,preparation:JSON.stringify(canonical({spec:d.spec,frames:d.result.frames,algorithm:d.result.algorithm}))}
}
/** These are a creator's observations, never automatic visual certification. */
export function actorReviewStatus(answers:ActorAnswers){
 assertAnswers(answers);const values=ACTOR_DIRECTIONS.flatMap(d=>ACTOR_ROW_CHECKS.map(c=>answers[d][c]))
 return values.includes('fail')?'rejected':values.every(v=>v==='pass')?'sheet-reviewed':'incomplete'
}
export function assertActorSheetReview(r:any,d:ActorReviewTarget):asserts r is ActorSheetReview{
 if(!r||Object.keys(r).sort().join(',')!==(r.map===undefined?'answers,candidateSha256,draftId,preparation,recordedAt,sourceSha256,version':'answers,candidateSha256,draftId,map,preparation,recordedAt,sourceSha256,version')||r.version!==1||!Number.isSafeInteger(r.recordedAt)||r.recordedAt<0)return invalid()
 const expected=binding(d);for(const key of Object.keys(expected) as Array<keyof typeof expected>)if(r[key]!==expected[key])return invalid()
 assertAnswers(r.answers)
 if(r.map!==undefined){if(actorReviewStatus(r.answers)!=='sheet-reviewed')return invalid();assertActorMapReview(r.map,d)}
}
export async function saveActorMapReview(repo:SpriteDraftRepository,expected:SpriteDraft,map:ActorMapReview,candidate:ActorPreview,decode:(png:SpritePng)=>Promise<PixelRaster>){
 const current=await repo.get()
 if(!current||current.id!==expected.id||current.revision!==expected.revision||JSON.stringify(current.actorReview)!==JSON.stringify(expected.actorReview))throw Error('SPRITE_DRAFT_REPLACED')
 assertActorSheetReview(current.actorReview,current)
 if(actorReviewStatus(current.actorReview.answers)!=='sheet-reviewed')throw Error('ACTOR_MAP_REVIEW_REQUIRED')
 const checked=await inspectActorMapCandidate(current,current.id,decode)
 if(checked.png.sha256!==candidate.png.sha256||map.scale!==checked.scale||JSON.stringify(map.bounds)!==JSON.stringify(checked.frameBounds))throw Error('SPRITE_DRAFT_REPLACED')
 const next:SpriteDraft={...current,actorReview:{...structuredClone(current.actorReview),recordedAt:Date.now(),map:structuredClone(map)}}
 assertActorSheetReview(next.actorReview,next);await repo.save(next,current);return next
}
export function currentActorReview(d:SpriteDraft){try{assertActorSheetReview(d.actorReview,d);return d.actorReview}catch{return undefined}}
export async function saveActorSheetReview(repo:SpriteDraftRepository,expected:SpriteDraft,answers:ActorAnswers){
 assertAnswers(answers);const current=await repo.get()
 if(!current||current.id!==expected.id||current.revision!==expected.revision||JSON.stringify(binding(current))!==JSON.stringify(binding(expected))||JSON.stringify(current.actorReview)!==JSON.stringify(expected.actorReview))throw Error('SPRITE_DRAFT_REPLACED')
 await verifySpritePng(current.source);await verifySpritePng(current.result!.png)
 const next:SpriteDraft={...current,actorReview:{version:1,...binding(current),recordedAt:Date.now(),answers:structuredClone(answers)}}
 assertActorSheetReview(next.actorReview,next)
 // Like deviceReview, local review metadata does not change the immutable art
 // archive revision. It is deliberately not serialized by spriteManifest.
 await repo.save(next,current);return next
}
