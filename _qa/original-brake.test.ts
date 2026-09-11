import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {PreflightStorage} from '../server/preflight-storage'
import {OriginalTrainAuthority,originalTrainRuntime,originalCartridge,type OriginalHead} from '../server/original-train-runtime'
import {OriginalSessionClient} from '../src/original-session-client'
import {originalReleasedPresentation} from '../server/original-presentation'
import {originalGameEntities} from '../src/original-game-projection'
import {originalBrakeState} from '../src/original-equipment-state'
import {originalEquipmentSlots,originalEquipmentBodies,originalEquipmentAnimation,originalEquipmentHasArt} from '../src/original-equipment-art'
import {originalWorldWalkable} from '../src/original-world-space'
import {originalVisualContext} from '../server/original-visual-context'
import {brakeArt,originalBrakeSheet} from '../src/original-brake-art'
import {resolveDomainAction} from '../src/vendor/original-train/engine/domainRules'
const intent=(h:OriginalHead,action:string)=>({action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:'brakes',position:{x:260,y:195},type:'action',action})
for(const locale of ['zh','en']as const)test(`brake ${locale}: repair cannot recreate its old fault; client refusal clears pending and retains authority`,async()=>{
 const pool=new PreflightStorage(),ctx=pool.context('synthetic-brake'),db={all:<T>(s:string,...p:any[])=>ctx.storage.sql.exec(s,...p).toArray() as T[],run:(s:string,...p:any[])=>{ctx.storage.sql.exec(s,...p)},transaction:<T>(f:()=>T)=>ctx.storage.transactionSync(f)},service=new OriginalTrainAuthority(db,originalReleasedPresentation)
 const values=new Map<string,string>(),store={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v)},removeItem:(k:string)=>values.delete(k)} as unknown as Storage
 const client=new OriginalSessionClient(store,'brake-',async(p,b:any)=>{if(p==='/sessions')return service.create('synthetic',b.enrollment_id,b.locale);const [,id,suffix]=p.match(/^\/sessions\/([^/]+)(\/actions)?$/)!;return suffix?service.action('synthetic',id,b):service.get('synthetic',id)})
 try{let h=await client.enroll(locale);const initial=h,bindings=structuredClone(h.assets)
  h=(await client.send(h,intent(h,'inspect-brakes'))).head;assert.equal(h.save.facts['brake-hose-warning'],true);assert.equal(originalBrakeState(h.save),'cracked')
  h=(await client.send(h,intent(h,'replace-brake-hose'))).head;assert.equal(originalBrakeState(h.save),'replaced');assert.equal(h.save.stats.condition,initial.save.stats.condition+10);assert.equal(h.save.inventory.find(i=>i.id==='spare-hose')?.count??0,0)
  // This is the actual frozen-rule regression; no vendored source is rewritten.
  assert.equal(resolveDomainAction(h.save,originalCartridge(locale),locale==='zh'?'检查制动':'inspect brakes')?.status,'accepted')
  const e=originalGameEntities(h).find(e=>e.id==='brakes');assert.ok(e?.label);assert.equal(e.actions.length,0)
  for(const action of ['inspect-brakes','replace-brake-hose']){const r=await client.send(h,intent(h,action));assert.equal(r.accepted,false);assert.equal(r.rejectionCode,'ORIGINAL_BRAKE_ALREADY_REPAIRED');assert.equal(client.hasPending(),false);assert.deepEqual(r.head,h)}
  await assert.rejects(service.action('synthetic',h.id,{...intent(h,'inspect-brakes'),type:'free-input',text:locale==='zh'?'检查制动':'inspect brakes'}),/ORIGINAL_BRAKE_ALREADY_REPAIRED/)
  assert.deepEqual(await client.enroll(locale),h);assert.deepEqual(h.assets,bindings);assert.deepEqual(service.get('synthetic',h.id),h);assert.equal(service.events('synthetic',h.id,0).length,2)
  const context=originalVisualContext(h,'ada-mechanic').equipment.find(e=>e.id==='brakes');assert.equal(context?.state,'replaced');assert.equal(context?.assetSha256,brakeArt.resource.sha256)
 }finally{pool.close()}
})
test('brake parts use one immutable base, transparent PNG and a single stable body; old bindings retain old geometry',()=>{
 const runtime=originalTrainRuntime(originalReleasedPresentation),h=runtime.initial('en',randomUUID()),slots=originalEquipmentSlots(h.sceneId,h.assets).filter(e=>e.entityId==='brakes')
 assert.equal(slots.length,2);assert.equal(slots[0].graphic,slots[1].graphic)
 assert.equal(originalEquipmentAnimation(h.save,'brake-base'),'base');assert.equal(originalEquipmentAnimation(h.save,'brake-hose'),'cracked')
 const repaired=structuredClone(h);repaired.save.facts['brake-hose-replaced']=true
 assert.equal(originalEquipmentAnimation(repaired.save,'brake-base'),'base');assert.equal(originalEquipmentAnimation(repaired.save,'brake-hose'),'replaced');assert.deepEqual(originalEquipmentBodies(h.sceneId,h.assets),originalEquipmentBodies(repaired.sceneId,repaired.assets))
 assert.equal(originalEquipmentBodies(h.sceneId,h.assets).filter(b=>b.id==='brakes').length,1);assert.equal(originalWorldWalkable(h,{x:260,y:158}),false);assert.equal(originalWorldWalkable(h,{x:260,y:195}),true)
 const old=structuredClone(h);if(old.assets?.version!==1)throw Error('TEST_ASSETS');delete old.assets.fixedEquipment!.brakes
 assert.equal(originalEquipmentHasArt('brakes',old.assets),false);assert.equal(originalWorldWalkable(old,{x:260,y:158}),true);assert.deepEqual(runtime.upgrade(old).assets,old.assets)
 const bytes=readFileSync(new URL('../public/art/brake-parts-v1.png',import.meta.url));assert.equal(bytes[25],6);assert.equal(bytes.length,brakeArt.resource.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),brakeArt.resource.sha256)
 const sheet=originalBrakeSheet('checked.png');assert.deepEqual(Object.keys(sheet.textures),['base','cracked','replaced']);assert.equal(sheet.framesWidth,3)
 const pass=structuredClone(h);pass.save.facts['pass-method']='air-brake';assert.equal(originalBrakeState(pass.save),'replaced')
})
