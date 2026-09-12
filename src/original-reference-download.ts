import type {OriginalIllustration} from './original-illustration-contract'

/** Return bytes only after the persisted source digest is verified. */
export async function downloadOriginalReference(reference:NonNullable<OriginalIllustration['reference']>,signal:AbortSignal,request:typeof fetch=fetch):Promise<Uint8Array<ArrayBuffer>>{
 signal.throwIfAborted()
 const response=await request(reference.url,{signal,credentials:'omit',referrerPolicy:'no-referrer'})
 if(!response.ok||!response.body)throw Error('REFERENCE_UNAVAILABLE')
 const reader=response.body.getReader(),parts:Uint8Array[]=[];let length=0
 try{
  while(true){
   signal.throwIfAborted()
   const part=await reader.read();if(part.done)break
   length+=part.value.length
   if(length>8388608)throw Error('REFERENCE_TOO_LARGE')
   parts.push(part.value)
  }
 }catch(error){try{await reader.cancel()}catch{}throw error}finally{reader.releaseLock()}
 signal.throwIfAborted()
 const bytes=new Uint8Array(length);let offset=0
 for(const part of parts){bytes.set(part,offset);offset+=part.length}
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('')
 signal.throwIfAborted()
 if(sha!==reference.sha256)throw Error('REFERENCE_CHANGED')
 return bytes
}
