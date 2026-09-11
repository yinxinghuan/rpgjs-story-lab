/** One existing game and authority, with an explicit route to the older carriage. */
export const ORIGINAL_STORY_RELEASED=true
export function originalEntry(mode:string,hostname:string,search:string){
 const q=new URLSearchParams(search)
 if(q.get('story_runtime')==='legacy'||hostname.endsWith('.github.io')||mode==='pages')return false
 return mode==='cloud-preflight'?q.get('story')==='original':mode==='cloud'&&ORIGINAL_STORY_RELEASED&&q.get('story')!=='carriage'
}
