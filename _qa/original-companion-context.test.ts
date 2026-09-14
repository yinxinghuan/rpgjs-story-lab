import test from 'node:test'
import assert from 'node:assert/strict'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalCompanionContext} from '../src/original-companion-context'
import {originalBoundWorldPlan} from '../src/original-world-plan'
import {originalCharacterBodies} from '../src/original-character-space'
import {originalWorldWalkable} from '../src/original-world-space'
const fixture=()=>{
 const h=originalTrainRuntime(()=>true).initial('zh','12345678-1234-1234-1234-123456789012')
 h.save.partyMemberIds=['ada-mechanic'];h.save.characters.find(c=>c.id==='ada-mechanic')!.status='companion'
 return h
}
test('moving actor body and interaction entity use the same foot-center transform in this scene only',()=>{
 const h=fixture(),before=structuredClone(h),poses={'ada-mechanic':{x:220,y:430}},context=originalCompanionContext(h,poses)
 const body=originalCharacterBodies(context).find(b=>b.id==='ada-mechanic')!
 assert.equal(body.x,220);assert.equal(body.y,430)
 const base=originalBoundWorldPlan(h.assets),moved=originalBoundWorldPlan(h.assets,context.companionPositions,h.sceneId)
 const actor=base.characters.find(c=>c.id==='ada-mechanic')!
 for(const e of moved.entities){
  const old=base.entities.find(b=>b.id===e.id)!
  if(e.scene===h.sceneId&&actor.entities.includes(e.id))assert.deepEqual(e.position,{x:224.5,y:445})
  else assert.deepEqual(e,old)
 }
 assert.equal(originalWorldWalkable(context,{x:220,y:430}),false)
 assert.deepEqual(h,before);poses['ada-mechanic'].x=0;assert.equal(context.companionPositions!['ada-mechanic'].x,220)
})
test('legacy positioning remains unchanged when no snapshot is supplied',()=>{
 const h=fixture();assert.equal(originalCompanionContext(h,undefined),h)
 assert.deepEqual(originalCharacterBodies(h),originalCharacterBodies(originalCompanionContext(h,{})))
})
test('a position snapshot cannot introduce a future character, recruit someone or move a device',()=>{
 const h=fixture()
 for(const id of ['ren-medic','starter','unknown'])assert.throws(()=>originalCompanionContext(h,{[id]:{x:220,y:430}}),/COMPANION_NOT_FOLLOWING/)
 h.save.partyMemberIds=[];assert.throws(()=>originalCompanionContext(h,{'ada-mechanic':{x:220,y:430}}),/COMPANION_NOT_FOLLOWING/)
})
test('malformed positions and occupied ground are rejected rather than corrected silently',()=>{
 const h=fixture()
 for(const value of [null,[],{'ada-mechanic':{x:Infinity,y:430}},{'ada-mechanic':{x:220,y:430,scene:'elsewhere'}},{'ada-mechanic':{x:-100,y:-100}}])assert.throws(()=>originalCompanionContext(h,value),/INVALID_COMPANION_POSITION/)
})
