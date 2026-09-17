import test from 'node:test'
import assert from 'node:assert/strict'
import {developingTarget,developingPreview,developingMatches} from '../src/old-street-developing-puzzle'
import {oldStreetRuntime} from '../server/old-street-runtime'
import {randomUUID} from 'node:crypto'
import {oldStreetAttemptContext} from '../server/old-street-attempt'
test('only the visibly sharp and balanced adjustment completes each fixed photograph',()=>{
 const variations=new Set<string>()
 for(const version of ['a'.repeat(64),'b'.repeat(64),'c'.repeat(64),'sample-four','sample-five']){
  const target=developingTarget(version);variations.add(JSON.stringify(target));let solutions=0
  for(let focus=0;focus<=6;focus++)for(let exposure=0;exposure<=6;exposure++){
   const setting={focus,exposure},view=developingPreview(version,setting),accepted=developingMatches({version,method:'develop-v1',...setting},version)
   assert.equal(accepted,view.blur===0&&view.brightness===1)
   if(accepted)solutions++
  }
  assert.equal(solutions,1)
  assert.equal(developingMatches({version:'stale-image',method:'develop-v1',...target},version),false)
  for(const focus of [-1,7,2.5,NaN])assert.equal(developingMatches({version,method:'develop-v1',...target,focus},version),false)
  assert.equal(developingMatches({version,...target},version),false)
 }
 assert.ok(variations.size>1)
})
test('new commission opts into developing; upgrading old commissions does not change their puzzle',()=>{
 const runtime=oldStreetRuntime(()=>true,undefined,undefined,()=>undefined,()=>undefined,undefined,async()=>({}))
 const current=runtime.initial('en',randomUUID(),{campaign:'letter-trail-v3'})
 assert.equal(current.campaign?.photoMethod,'develop-v1')
 const old=structuredClone(current);delete old.campaign!.photoMethod
 assert.equal(runtime.upgrade(old).campaign?.photoMethod,undefined)
 assert.equal(runtime.initial('en',randomUUID(),{campaign:'letter-trail-v2'}).campaign?.photoMethod,undefined)
})

test('free-input scene knowledge describes the admitted photograph interaction, retaining legacy matching',()=>{
 const h=oldStreetRuntime(()=>true).initial('en',randomUUID())
 h.sceneId='darkroom'
 h.expansions=[{version:1,id:randomUUID(),template:'photo-darkroom-v1',sourceScene:'photo',input:'Find an old photograph',status:'requested',requestedAtVersion:0,photoMethod:'develop-v1'}]
 const knowledge=()=>oldStreetAttemptContext(h,'developing-bench',[{id:'oldstreet:match-darkroom-photo',label:'Focus and expose'}]).knowledge.find(k=>k.id==='visible:developing-bench')!.text
 assert.match(knowledge(),/focus and exposure/)
 assert.doesNotMatch(knowledge(),/assembled/)
 delete h.expansions[0].photoMethod
 assert.match(knowledge(),/assembled by hand/)
 h.save.facts['darkroom-photo-matched']='test-photo'
 h.save.facts['darkroom-photo-choice']='keep'
 assert.match(knowledge(),/in your bag/)
})
