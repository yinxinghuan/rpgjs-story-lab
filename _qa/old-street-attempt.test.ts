import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {createOldStreetAttemptGenerator,oldStreetAttemptContext} from '../server/old-street-attempt'
import {OldStreetAuthority} from '../server/old-street-runtime'
import {oldStreetDoors,oldStreetSpatialPlan} from '../src/old-street-space'
import {oldStreetJournal} from '../src/old-street-journal'
import type {AuthorityStorage} from '../server/session-authority'

test('unlisted observation commits text and grounded notes, replays once and preserves physical state',async()=>{
 const raw=new DatabaseSync(':memory:')
 const db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
 let calls=0
 const attempt=createOldStreetAttemptGenerator(async()=>++calls%2?{kind:'attempt',outcome:'observed',text:'你蹲下查看小格：它仍然锁着。',discoveryIds:['visible:letter-compartment']}:{valid:true})
 let service=new OldStreetAuthority(db,()=>true,undefined,undefined,undefined,undefined,attempt)
 try{
  let head=service.create('test',randomUUID(),'zh')
  const door=oldStreetDoors().find(d=>d.room==='street'&&d.destination.room==='shop')!
  head=(await service.action('test',head.id,{type:'action',action:door.actionId,action_id:randomUUID(),expected_version:head.version,sceneId:head.sceneId,target:door.id,position:door.approach})).head
  const entity=oldStreetSpatialPlan(head.save).entities.find(e=>e.id==='letter-compartment')!
  const body={type:'free-input',text:'我蹲下来查看小格。',action_id:randomUUID(),expected_version:head.version,sceneId:head.sceneId,target:entity.id,position:entity.approach}
  const result=await service.action('test',head.id,body)
  assert.equal(result.kind,'attempt');assert.equal(result.head.version,head.version+1)
  const {blocks,...before}=head.save,{blocks:afterBlocks,...after}=result.head.save
  assert.deepEqual(after,before);assert.equal(afterBlocks.length,blocks.length+1)
  assert.equal(oldStreetJournal(result.head.save).notes.filter(n=>n.title==='观察记录').length,1)
  service=new OldStreetAuthority(db,()=>true,undefined,undefined,undefined,undefined,attempt)
  assert.deepEqual(await service.action('test',head.id,body),result);assert.equal(calls,2)
  const restored=service.get('test',head.id)
  assert.equal(oldStreetAttemptContext(restored,entity.id,[]).recentAttempts[0].input,body.text)
 }finally{raw.close()}
})

test('hybrid resolver accepts transient attempts and persistent-change limitations, rejects fabricated state claims',async()=>{
 const context={locale:'zh' as const,scene:'shop',target:'drawer',inventory:[],knowledge:[{id:'visible:drawer',text:'抽屉被空盒挡住。'}],recentAttempts:[],introducedPerson:null,actions:[{id:'oldstreet:move-box',label:'移开空盒'}]}
 for(const outcome of ['inconclusive','needs-support'] as const){let n=0;const generate=createOldStreetAttemptGenerator(async()=>++n===1?{kind:'attempt',outcome,text:'你试着查看，暂时没有足够线索确认。',discoveryIds:[]}:{valid:true});assert.equal((await generate('听听里面有什么',context)).kind,'attempt')}
 let n=0
 const action=createOldStreetAttemptGenerator(async()=>++n===1?{kind:'action',actionId:'oldstreet:move-box'}:{valid:true})
 assert.equal((await action('我把盒子挪开。',context)).kind,'action')
 for(const candidate of [{kind:'attempt',outcome:'observed',text:'柜中有新钥匙。',discoveryIds:['invented']},{kind:'attempt',outcome:'observed',text:'柜子已经拆了。',discoveryIds:[],commands:['unlock']},{kind:'action',actionId:'invented'}]){
  const result=await createOldStreetAttemptGenerator(async()=>candidate)('拆柜子',context);assert.equal(result.kind,'attempt');if(result.kind==='attempt'){assert.deepEqual(result.discoveryIds,[]);assert.equal(result.outcome,'inconclusive');assert.ok(!result.text.includes('已经拆'))}
 }
 n=0;const rejected=await createOldStreetAttemptGenerator(async()=>++n===1?{kind:'attempt',outcome:'observed',text:'你已拿到信。',discoveryIds:[]}:{valid:false})('查看小格',context);assert.equal(rejected.kind,'attempt');if(rejected.kind==='attempt')assert.ok(!rejected.text.includes('拿到信'))
})
