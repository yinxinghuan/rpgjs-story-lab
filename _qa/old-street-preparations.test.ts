import test from 'node:test'
import assert from 'node:assert/strict'
import {PreparationHistory,preparationTargets,readPreparation,type PreparationTarget} from '../src/old-street-preparations'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import type {OldStreetHead} from '../src/old-street-head'
const target:PreparationTarget={id:'photo',path:'/sessions/synthetic/expansion-photo',place:'Darkroom',title:'Photograph',returnTo:'Return to the bench.'}
const caps={planning:true,media:true,campaign:true}
test('observing progress only reads an existing job; offline is distinct from generation failure',async()=>{
 const calls:unknown[][]=[]
 for(const [state,expected] of [['planning','waiting'],['preparing','waiting'],['queued','waiting'],['ready','ready'],['candidate','ready'],['failed','failed']]){
  const result=await readPreparation(async(...args)=>{calls.push(args);return {job:{state}}},target)
  assert.equal(result?.state,expected)
 }
 assert(calls.every(args=>args.length===1&&args[0]===target.path))
 assert.equal(await readPreparation(async()=>({job:null}),target),null)
 assert.equal((await readPreparation(async()=>{throw Error('offline')},target))?.state,'offline')
})
test('completion announces once after waiting, survives an offline gap, and does not repeat on restore or new journey',()=>{
 const history=new PreparationHistory(),row=(state:'ready'|'waiting'|'offline')=>({...target,state})
 assert.equal(history.update('A',[row('ready')]).length,0)
 assert.equal(history.update('A',[row('offline')]).length,0)
 assert.equal(history.update('A',[row('ready')]).length,0)
 history.update('A',[row('waiting')]);history.update('A',[row('offline')])
 assert.equal(history.update('A',[row('ready')]).length,1)
 assert.equal(history.update('A',[row('ready')]).length,0)
 history.update('A',[row('waiting')])
 assert.equal(history.update('B',[row('ready')]).length,0)
})
test('cold journeys reveal no jobs or future rooms; admitted and completed content stops being a preparation',()=>{
 const h={id:'synthetic',save:createInitialSave(oldStreetCartridge('en'))} as OldStreetHead
 assert.deepEqual(preparationTargets(h,caps),[])
 h.expansions=[{version:1,id:'synthetic-request',template:'photo-darkroom-v1',sourceScene:'photo',input:'Look for a photo',status:'requested',requestedAtVersion:1}]
 assert.deepEqual(preparationTargets(h,caps).map(t=>t.id),['area'])
 h.save.facts['darkroom-ready']=true
 assert.deepEqual(preparationTargets(h,caps).map(t=>t.id),['photo'])
 h.save.facts['darkroom-photo-matched']='saved-hash'
 assert.deepEqual(preparationTargets(h,caps),[])
 h.save.facts.departed=true
 assert.deepEqual(preparationTargets(h,caps),[])
})
test('campaign progress points back to the correct physical anchor without creating or admitting content',()=>{
 const h={id:'synthetic',save:createInitialSave(oldStreetCartridge('en')),campaign:{version:3}} as OldStreetHead
 assert.deepEqual(preparationTargets(h,caps),[])
 h.save.facts['letter-taken']=true
 const before=JSON.stringify(h)
 const rows=preparationTargets(h,caps)
 assert.equal(rows[0].id,'trace');assert.match(rows[0].returnTo,/record book/)
 assert.equal(JSON.stringify(h),before)
 assert.deepEqual(preparationTargets(h,{...caps,campaign:false}),[])
})
