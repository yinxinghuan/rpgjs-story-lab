import test from 'node:test'
import assert from 'node:assert/strict'
import {originalPreflightModels} from '../server/original-preflight-model'
import {createHandler} from '../worker/source'
import {ORIGINAL_API_PATH} from '../src/original-runtime-contract'
const context={locale:'zh' as const,sceneId:'train-at-dead-station',target:'starter',objective:'检修启动机',actions:[{id:'repair-starter',label:'检修启动机'}]}
test('original preflight is opt-in and bounds actual provider requests, including review',async()=>{
 assert.equal(originalPreflightModels(undefined),undefined);assert.equal(originalPreflightModels('0'),undefined)
 for(const bad of ['-1','1','13','4.5','Infinity','NaN',' 4'])assert.throws(()=>originalPreflightModels(bad))
 let calls=0
 const p=originalPreflightModels('2',async(system)=>{calls++;return system.startsWith('Interpret')?{kind:'action',actionId:'repair-starter'}:{valid:true,issues:[]}})!
 assert.equal(p.available(),true)
 assert.equal(await p.interpreter('我来把烧坏的启动装置检修好。',context),'repair-starter')
 assert.deepEqual(p.usage(),{used:2,limit:2});assert.equal(calls,2);assert.equal(p.available(),false)
 await assert.rejects(p.interpreter('我来把烧坏的启动装置检修好。',context),/ORIGINAL_MODEL_TEST_BUDGET_EXHAUSTED/);assert.equal(calls,2)
})
test('negated commitments do not spend provider budget and provider failures count once',async()=>{
 let calls=0;const p=originalPreflightModels('2',async()=>{calls++;throw Error('SYNTHETIC_PROVIDER_FAILURE')})!
 assert.equal(await p.interpreter('不要修理启动机',context),null);assert.equal(calls,0)
 await assert.rejects(p.interpreter('我来把烧坏的启动装置检修好。',context),/SYNTHETIC_PROVIDER_FAILURE/)
 assert.deepEqual(p.usage(),{used:1,limit:2});assert.equal(p.available(),false)
})
test('original health advertises conversation only under explicit preflight capability',async()=>{
 const req=new Request('http://localhost'+ORIGINAL_API_PATH+'/health'),env={} as any
 assert.equal((await createHandler(true,true)(req,env)).status,404)
 const defaultHealth=await (await createHandler(true,true,true)(req,env)).json() as any
 assert.equal(defaultHealth.liveModelAvailable,false);assert.equal(defaultHealth.liveDialogueAvailable,false)
 const enabled=await (await createHandler(true,true,true,()=>true)(req,env)).json() as any
 assert.equal(enabled.liveDialogueAvailable,true);assert.equal(enabled.liveModelAvailable,false)
})

test('an explicitly resumed trial cannot restore its already spent request budget',async()=>{
 let calls=0;const p=originalPreflightModels('6',async()=>{calls++;return {}},6)!
 assert.equal(p.available(),false);assert.deepEqual(p.usage(),{used:6,limit:6})
 await assert.rejects(p.interpreter('我来把烧坏的启动装置检修好。',context),/ORIGINAL_MODEL_TEST_BUDGET_EXHAUSTED/);assert.equal(calls,0)
 assert.throws(()=>originalPreflightModels('6',undefined,7));assert.throws(()=>originalPreflightModels('6',undefined,NaN))
})
