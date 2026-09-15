export const OLD_STREET_API_PATH = '/api/oldstreet'
export const OLD_STREET_RUNTIME_HEADER = 'X-Oldstreet-Runtime'
export const OLD_STREET_RUNTIME_CONTRACT = 'oldstreet-session-1.map-2'
// Remains closed until the actual presentation and production journey are admitted.
export const OLD_STREET_RELEASED = false

// Public playable preview is distinct from final art/content admission.
export const OLD_STREET_PREVIEW_RELEASED = true
export const OLD_STREET_EXPANSION_RELEASED = true
// Preview capability, not complete-game or verified-account admission.
export const OLD_STREET_NARRATION_PREVIEW = true
export const OLD_STREET_PREVIEW_VERSION = 'oldstreet-preview-art-gait-20260916'
export function oldStreetEntry(mode:string,hostname:string,search:string){
 const q=new URLSearchParams(search)
 if(hostname.endsWith('.github.io')||mode==='pages'||q.has('create_art')||q.has('scene_preview')||q.get('story_runtime')==='legacy')return false
 if(['original','carriage'].includes(q.get('story')??''))return false
 return mode==='oldstreet-dev'||(OLD_STREET_PREVIEW_RELEASED&&['cloud','cloud-preflight'].includes(mode))
}
