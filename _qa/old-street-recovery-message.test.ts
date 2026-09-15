import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetRecoveryMessage} from '../src/old-street-recovery-message'

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
