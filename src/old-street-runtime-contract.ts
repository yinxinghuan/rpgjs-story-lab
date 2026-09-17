export const OLD_STREET_API_PATH = '/api/oldstreet'
export const OLD_STREET_RUNTIME_HEADER = 'X-Oldstreet-Runtime'
export const OLD_STREET_RUNTIME_CONTRACT = 'oldstreet-session-1.map-2'
// Remains closed until the actual presentation and production journey are admitted.
export const OLD_STREET_RELEASED = false

// Public playable preview is distinct from final art/content admission.
export const OLD_STREET_PREVIEW_RELEASED = true
export const OLD_STREET_EXPANSION_RELEASED = true
// Candidate campaign still needs real generated-content and complete-story review.
// Injected local Worker providers exercise the same routes without opening it live.
export const OLD_STREET_CAMPAIGN_RELEASED = false
// Preview capability, not complete-game or verified-account admission.
export const OLD_STREET_NARRATION_PREVIEW = true
export const OLD_STREET_PREVIEW_VERSION = 'oldstreet-preview-neighborhood-recovery-20260917'
/** A local launch profile, not a production switch or a migration of saved journeys. */
export function oldStreetNewJourneyOptions(mode:string,dev:boolean,preview:string|undefined){
 return dev&&mode==='oldstreet-dev'&&preview==='1'?{campaign:'letter-trail-v4'}:undefined
}
export function oldStreetEntry(mode:string,hostname:string,search:string){
 const q=new URLSearchParams(search)
 if(hostname.endsWith('.github.io')||mode==='pages'||q.has('create_art')||q.has('scene_preview')||q.get('story_runtime')==='legacy')return false
 if(['original','carriage'].includes(q.get('story')??''))return false
 return mode==='oldstreet-dev'||(OLD_STREET_PREVIEW_RELEASED&&['cloud','cloud-preflight'].includes(mode))
}
