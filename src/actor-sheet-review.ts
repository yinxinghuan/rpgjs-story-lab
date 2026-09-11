import {verifySpritePng,type SpriteDraft,type SpriteDraftRepository,type SpritePng} from './sprite-draft'

export const ACTOR_DIRECTIONS=['down','left','right','up'] as const
export const ACTOR_ROW_CHECKS=['facing','alternatingSteps','attachments'] as const
export type ActorDirection=typeof ACTOR_DIRECTIONS[number]
export type ActorVerdict='unchecked'|'pass'|'fail'
export type ActorAnswers=Record<ActorDirection,Record<typeof ACTOR_ROW_CHECKS[number],ActorVerdict>>
export type ActorSheetReview={version:1;draftId:string;sourceSha256:string;candidateSha256:string;preparation:string;recordedAt:number;answers:ActorAnswers}
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
 if(!r||Object.keys(r).sort().join(',')!=='answers,candidateSha256,draftId,preparation,recordedAt,sourceSha256,version'||r.version!==1||!Number.isSafeInteger(r.recordedAt)||r.recordedAt<0)return invalid()
 const expected=binding(d);for(const key of Object.keys(expected) as Array<keyof typeof expected>)if(r[key]!==expected[key])return invalid()
 assertAnswers(r.answers)
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
