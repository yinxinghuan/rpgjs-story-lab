/** Visual provenance only. Never an account identifier or ownership proof.
 * References stay private; no avatar URL is carried into a sprite archive. */
export type ProtagonistIdentity = {
  version: 1 | 2
  motion?: 'glide'
  slot: 'protagonist'
  referenceSha256: string
  sourceSha256: string
}

export function assertProtagonistIdentity(value: unknown, sourceSha256: string): asserts value is ProtagonistIdentity {
  const v = value as ProtagonistIdentity
  if (!v || Object.keys(v).sort().join(',') !== (v.version===2?'motion,referenceSha256,slot,sourceSha256,version':'referenceSha256,slot,sourceSha256,version')
    || ![1,2].includes(v.version) || v.version===2&&v.motion!=='glide' || v.slot !== 'protagonist'
    || typeof v.referenceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(v.referenceSha256)
    || typeof v.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(v.sourceSha256)
    || v.sourceSha256 !== sourceSha256) throw Error('PROTAGONIST_IDENTITY_INVALID')
}

export function protagonistIdentity(referenceSha256: string, sourceSha256: string, motion: 'walk'|'glide'='walk'): ProtagonistIdentity {
  if(!['walk','glide'].includes(motion))throw Error('PROTAGONIST_IDENTITY_INVALID')
  const value: ProtagonistIdentity = {version: motion==='glide'?2:1, ...(motion==='glide'?{motion:'glide' as const}:{}), slot: 'protagonist', referenceSha256, sourceSha256}
  assertProtagonistIdentity(value, sourceSha256)
  return value
}

export const PROTAGONIST_IDENTITY_CHECKS = ['silhouette', 'covering', 'costume', 'proportions'] as const
export type ProtagonistIdentityReview = {
  referenceSha256: string
  checks: Record<typeof PROTAGONIST_IDENTITY_CHECKS[number], 'unchecked'|'pass'|'fail'>
}
export function assertProtagonistIdentityReview(value: unknown, identity: ProtagonistIdentity): asserts value is ProtagonistIdentityReview {
  const r=value as ProtagonistIdentityReview
  if(!r || Object.keys(r).sort().join(',')!=='checks,referenceSha256' || r.referenceSha256!==identity.referenceSha256
    || !r.checks || Object.keys(r.checks).sort().join(',')!==[...PROTAGONIST_IDENTITY_CHECKS].sort().join(',')
    || PROTAGONIST_IDENTITY_CHECKS.some(k=>!['unchecked','pass','fail'].includes(r.checks[k]))) throw Error('PROTAGONIST_IDENTITY_REVIEW_INVALID')
}
export function protagonistIdentityReviewed(review: ProtagonistIdentityReview|undefined, identity: ProtagonistIdentity) {
  if(!review)return false
  assertProtagonistIdentityReview(review,identity)
  return PROTAGONIST_IDENTITY_CHECKS.every(k=>review.checks[k]==='pass')
}

export const protagonistMotion=(identity?:ProtagonistIdentity)=>identity?.version===2?identity.motion!:"walk"
