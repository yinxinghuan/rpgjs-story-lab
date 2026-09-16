import test from 'node:test'
import assert from 'node:assert/strict'
import {readExpansionJob} from '../src/old-street-expansion-recovery'

test('every pending poll may resume the same job, never requests regeneration',async()=>{
 const calls:unknown[]=[]
 const api=async(path:string,body?:unknown)=>{calls.push([path,body]);return {job:{state:'preparing'}}}
 await readExpansionJob(api,'/photo','preparing')
 await readExpansionJob(api,'/photo','preparing')
 assert.deepEqual(calls,[['/photo',undefined],['/photo',{}],['/photo',undefined],['/photo',{}]])
})
test('completed, failed and absent jobs are only read; leaving the view never starts work',async()=>{
 for(const state of ['candidate','failed',undefined]){
  const calls:unknown[]=[]
  await readExpansionJob(async(_path,body)=>{calls.push(body);return {job:state?{state}:null}},'/photo','preparing')
  assert.deepEqual(calls,[undefined])
 }
 let active=true,release!:(value:unknown)=>void,posts=0
 const result=readExpansionJob(async(_path,body)=>body?(posts++,{}):new Promise(resolve=>{release=resolve}),'/photo','preparing',()=>active)
 active=false;release({job:{state:'preparing'}});await result;assert.equal(posts,0)
})
test('queued plans resume and transport errors remain visible to the caller',async()=>{
 let posts=0
 const result=await readExpansionJob(async(_path,body)=>({job:{state:body?(posts++,'planning'):'queued'}}),'/plan','queued')
 assert.equal(posts,1);assert.equal(result.job.state,'planning')
 await assert.rejects(readExpansionJob(async()=>{throw Error('offline')},'/photo','preparing'),/offline/)
})
