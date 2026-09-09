export type RuntimeKind='browser'|'local'|'cloud'|'mirror'
export function selectRuntime(mode:string,hostname:string,search:string):RuntimeKind{
 const query=new URLSearchParams(search)
 // One cloud build: same-UUID authority on the main site; explicit legacy saves on Pages.
 if(mode==='cloud'||mode==='cloud-preflight'){
  if(query.get('story_runtime')==='legacy')return 'browser'
  if(hostname.endsWith('.github.io'))return 'mirror'
  return 'cloud'
 }
 return mode==='pages'?'browser':'local'
}
