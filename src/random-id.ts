// LAN HTTP does not expose randomUUID in Safari. getRandomValues remains
// available there; keep cryptographic entropy for owner and replay identities.
export function randomId(source:Pick<Crypto,'getRandomValues'>=globalThis.crypto):string {
 if(!source?.getRandomValues)throw new Error('SECURE_RANDOM_UNAVAILABLE')
 const bytes=source.getRandomValues(new Uint8Array(16))
 bytes[6]=(bytes[6]&0x0f)|0x40
 bytes[8]=(bytes[8]&0x3f)|0x80
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}
