import {test} from 'node:test'
import assert from 'node:assert/strict'
import {webcrypto} from 'node:crypto'
import {randomId} from '../src/random-id'
test('LAN browser can generate auth, enrollment and replay IDs without randomUUID',()=>{
 const lanCrypto={getRandomValues:webcrypto.getRandomValues.bind(webcrypto)} as Pick<Crypto,'getRandomValues'>
 assert.equal('randomUUID' in lanCrypto,false)
 const ids=Array.from({length:64},()=>randomId(lanCrypto))
 assert.equal(new Set(ids).size,64)
 for(const id of ids)assert.match(id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
 assert.match(ids[0]+ids[1],/^[a-zA-Z0-9-]{32,100}$/)
})
test('no insecure randomness fallback when Web Crypto is absent',()=>{
 assert.throws(()=>randomId({} as Crypto), /SECURE_RANDOM_UNAVAILABLE/)
})
