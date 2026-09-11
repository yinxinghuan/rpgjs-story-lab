import {assertActorSheetReview,ACTOR_DIRECTIONS,ACTOR_ROW_CHECKS,type ActorSheetReview,type ActorReviewTarget} from './actor-sheet-review'
import {assertSpriteManifest,type SpriteArchiveManifest} from './sprite-archive-contract'
export const ACTOR_REVIEW_LIMIT=64
export type ArchivedActorReview={version:1;id:string;revision:number;createdAt:number;review:ActorSheetReview}
export function actorReviewTarget(manifest:SpriteArchiveManifest):ActorReviewTarget{
 assertSpriteManifest(manifest);const d=manifest.draft
 return {...d,source:{sha256:manifest.files.find(f=>f.role==='source')!.sha256},result:{...d.result,png:{sha256:manifest.files.find(f=>f.role==='candidate')!.sha256}}}
}
/** Content identity survives lost responses and refresh without a second intent. */
export async function actorReviewId(r:ActorSheetReview){
 const fields:any[]=[r.version,r.draftId,r.sourceSha256,r.candidateSha256,r.preparation,r.recordedAt,ACTOR_DIRECTIONS.map(d=>ACTOR_ROW_CHECKS.map(c=>r.answers[d][c]))]
 // Keep old sheet-only identities byte-for-byte stable across this addition.
 if(r.map)fields.push([r.map.version,r.map.layout,r.map.scale,r.map.bounds,r.map.checks,r.map.visualAccepted])
 const text=JSON.stringify(fields)
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),v=>v.toString(16).padStart(2,'0')).join('')
}
export async function assertArchivedActorReview(r:any,target:ActorReviewTarget):Promise<void>{
 if(!r||Object.keys(r).sort().join(',')!=='createdAt,id,review,revision,version'||r.version!==1||!Number.isInteger(r.revision)||r.revision<1||r.revision>ACTOR_REVIEW_LIMIT||!Number.isSafeInteger(r.createdAt)||r.createdAt<0||typeof r.id!=='string'||!/^[a-f0-9]{64}$/.test(r.id))throw Error('SPRITE_ACTOR_REVIEW_ARCHIVE_INVALID')
 assertActorSheetReview(r.review,target)
 if(await actorReviewId(r.review)!==r.id)throw Error('SPRITE_ACTOR_REVIEW_ARCHIVE_INVALID')
}
