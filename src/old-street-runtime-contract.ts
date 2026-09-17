export const OLD_STREET_API_PATH = '/api/oldstreet'
export const OLD_STREET_RUNTIME_HEADER = 'X-Oldstreet-Runtime'
export const OLD_STREET_RUNTIME_CONTRACT = 'oldstreet-session-1.map-2'
// Remains closed until the actual presentation and production journey are admitted.
export const OLD_STREET_RELEASED = false

// Public playable preview is distinct from final art/content admission.
export const OLD_STREET_PREVIEW_RELEASED = true
export const OLD_STREET_EXPANSION_RELEASED = true
// Full trail is admitted to the playable preview after a normal-start live journey.
// This does not mark final content, account recovery or device acceptance complete.
export const OLD_STREET_CAMPAIGN_RELEASED = true
// Preview capability, not complete-game or verified-account admission.
export const OLD_STREET_NARRATION_PREVIEW = true
export const OLD_STREET_PREVIEW_VERSION = 'oldstreet-preview-full-trail-20260917'
/** Only new enrollments use this policy; saved/pending journeys retain their rules. */
export function oldStreetNewJourneyOptions(mode:string,dev:boolean,preview:string|undefined){
 const cloud=OLD_STREET_CAMPAIGN_RELEASED&&['cloud','cloud-preflight'].includes(mode)
 const local=dev&&mode==='oldstreet-dev'&&preview==='1'
 return cloud||local?{campaign:'letter-trail-v4'}:undefined
}
export function oldStreetEntry(mode:string,hostname:string,search:string){
 const q=new URLSearchParams(search)
 if(hostname.endsWith('.github.io')||mode==='pages'||q.has('create_art')||q.has('scene_preview')||q.get('story_runtime')==='legacy')return false
 if(['original','carriage'].includes(q.get('story')??''))return false
 return mode==='oldstreet-dev'||(OLD_STREET_PREVIEW_RELEASED&&['cloud','cloud-preflight'].includes(mode))
}
