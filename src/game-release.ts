export type ReleaseManifest={schema:1;version:string}
export function releaseVersion(value:unknown):string|undefined{
 if(!value||typeof value!=='object')return
 const v=value as Partial<ReleaseManifest>
 return v.schema===1&&typeof v.version==='string'&&/^[a-f0-9]{24}$/.test(v.version)?v.version:undefined
}
/** Require two consecutive responses for the same new release, avoiding a
 * half-published manifest or a single stale edge response. Failures don't lock play. */
export function createReleaseProbe(current:string,changed:(version:string)=>void,request:typeof fetch=fetch,base=document.baseURI){
 let candidate='',running=false,disposed=false
 return {async check(){
  if(running||disposed)return false
  running=true
  try{
   const url=new URL('./release.json',base);url.searchParams.set('_check',String(Date.now()))
   const response=await request(url.href,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(8000)})
   const next=response.ok?releaseVersion(await response.json()):undefined
   if(disposed)return false
   if(!next||next===current){candidate='';return false}
   if(candidate===next){changed(next);return false}
   candidate=next;return true
  }catch{candidate='';return false}finally{running=false}
 },dispose(){disposed=true}}
}
export function releaseReloadUrl(href:string,version:string){const url=new URL(href);url.searchParams.set('_release',version);return url.href}
