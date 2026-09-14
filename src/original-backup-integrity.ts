/** v1 wire checksum. Integrity only; never an authorization to import a save. */
export const MAX_ORIGINAL_BACKUP_BYTES=16*1024*1024
const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v
export async function originalBackupDigest(payload:unknown){
 const bytes=new TextEncoder().encode(JSON.stringify(canonical(payload)))
 if(bytes.length>MAX_ORIGINAL_BACKUP_BYTES)throw Error('BACKUP_TOO_LARGE')
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('')
}
