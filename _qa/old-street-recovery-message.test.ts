import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetRecoveryMessage,oldStreetRecoveryCode} from '../src/old-street-recovery-message'

test('recovery diagnostics distinguish transport failures without exposing exception contents',()=>{
 assert.equal(oldStreetRecoveryCode('Error: SESSION_NOT_FOUND'),'SESSION_NOT_FOUND')
 assert.equal(oldStreetRecoveryCode('Error: RUNTIME_VERSION_MISMATCH'),'RUNTIME_VERSION_MISMATCH')
 assert.equal(oldStreetRecoveryCode('TimeoutError: The operation timed out.'),'REQUEST_TIMEOUT')
 assert.equal(oldStreetRecoveryCode('TypeError: Load failed'),'NETWORK_UNAVAILABLE')
 for(const raw of ['Error: request https://example.invalid/?token=SYNTHETIC_PRIVATE_DETAIL failed','Error: SESSION_NOT_FOUND private body','SyntaxError: unexpected private response']){
  assert.equal(oldStreetRecoveryCode(raw),'RECOVERY_UNCLASSIFIED')
 }
})

test('player recovery copy never echoes an unknown transport body or private URL',()=>{
 const payload='Error: request https://example.invalid/?token=SYNTHETIC_PRIVATE_DETAIL failed'
 for(const locale of ['zh','en'] as const){
  const message=oldStreetRecoveryMessage(payload,locale)
  assert.ok(message.length>0);assert.ok(!message.includes('SYNTHETIC_PRIVATE_DETAIL'));assert.ok(!message.includes('https://'))
  assert.equal(message,oldStreetRecoveryMessage('Error: arbitrary upstream body',locale))
 }
})
test('unsupported saves and map failures receive distinct recovery guidance without raw codes',()=>{
 for(const locale of ['zh','en'] as const){
  const save=oldStreetRecoveryMessage('OLD_STREET_SAVE_UNSUPPORTED',locale),map=oldStreetRecoveryMessage('MAP_TRANSFER_TIMEOUT',locale)
  assert.notEqual(save,map)
  assert.ok(!save.includes('SAVE_UNSUPPORTED'));assert.ok(!map.includes('MAP_TRANSFER_TIMEOUT'))
 }
})
