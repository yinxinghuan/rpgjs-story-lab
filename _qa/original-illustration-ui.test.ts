import test from 'node:test'
import assert from 'node:assert/strict'
import {illustrationAction,readOriginalIllustrations,type OriginalIllustration} from '../src/original-illustration-contract'
const job:OriginalIllustration={id:crypto.randomUUID(),scene:'train-at-dead-station',sourceVersion:0,referenceVersion:'original-source',state:'preparing',attempt:1,recoverable:true,nextAt:0}
test('old-place recovery remains available; only a new intention needs the current place and available budget',()=>{
 assert.equal(illustrationAction(job,'train-at-river-valley',job.scene,0),'recover')
 assert.equal(illustrationAction({...job,nextAt:60000},'train-at-river-valley',job.scene,59999),'wait')
 assert.equal(illustrationAction({...job,state:'failed',recoverable:false},'train-at-river-valley',job.scene,0),'retry')
 assert.equal(illustrationAction({...job,state:'candidate'},job.scene,job.scene,0),'review')
 assert.equal(illustrationAction({...job,state:'failed',recoverable:false,attempt:2},job.scene,job.scene,0),'exhausted')
 assert.equal(illustrationAction({...job,state:'failed',recoverable:false},job.scene,job.scene,0),'retry')
 assert.equal(illustrationAction(undefined,job.scene,job.scene,0),'create')
 assert.equal(illustrationAction({...job,state:'active'},job.scene,job.scene,0),'complete')
})
test('invalid list, duplicate scene, status, PNG metadata and counters cannot silently render a successful image',()=>{
 assert.deepEqual(readOriginalIllustrations({illustrations:[job]}),[job])
 for(const value of [{illustrations:[job,job]},{illustrations:[{...job,state:'success'}]},{illustrations:[{...job,state:'active'}]},{illustrations:[{...job,nextAt:NaN}]},{illustrations:[{...job,attempt:3}]},{illustrations:[{...job,scene:'../../account'}]},{illustrations:[{...job,state:'active',asset:{sha256:'a'.repeat(64),width:769,height:1024,bytes:100}}]},{}])assert.throws(()=>readOriginalIllustrations(value),/INVALID_RESPONSE/)
})
