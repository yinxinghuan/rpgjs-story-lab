import test from 'node:test'
import assert from 'node:assert/strict'
import {lastTrainToDawn,lastTrainToDawnEn} from '../src/vendor/original-train/cartridges/lastTrainToDawn'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {resolveDomainAction,applyDomainResolution} from '../src/vendor/original-train/engine/domainRules'
import {explorationCircuitFacts,explorationCircuitRules,explorationCircuitState} from '../src/exploration-circuit-rules'
for(const locale of ['zh','en'] as const){
 const setup=()=>{const cartridge={...(locale==='zh'?lastTrainToDawn:lastTrainToDawnEn),domainRules:{rules:explorationCircuitRules(locale)}};let save=createInitialSave(cartridge);save.facts={...explorationCircuitFacts,'explore-fuse-slot':'bag'};save.map=[{id:'explore-power',label:'Power room',current:true,visited:true},{id:'explore-signal-inside',label:'Inside',current:false,visited:false}];save.characters=[];save.partyMemberIds=[];save.inventory=[{id:'explore-fuse',label:'Fuse',count:1,rarity:'common' as const,detail:'',effect:''},{id:'explore-wedge',label:'Wedge',count:1,rarity:'common' as const,detail:'',effect:''}];const run=(id:string)=>{cartridge.domainRules.rules=explorationCircuitRules(locale,save);const r=resolveDomainAction(save,cartridge,id)!;assert.ok(r);applyDomainResolution(save,cartridge,r);return r.status};return {get save(){return save},run,reload(){save=JSON.parse(JSON.stringify(save))}}}
 for(const toolFirst of [false,true])test(`discover tools from an empty bag, tool first=${toolFirst} (${locale})`,()=>{
  const s=setup();s.save.facts={...explorationCircuitFacts};s.save.inventory=[]
  assert.equal(s.run('explore-take-fuse'),'rejected')
  if(toolFirst)assert.equal(s.run('explore-take-wedge'),'accepted')
  assert.equal(s.run('explore-open-cabinet'),'accepted');assert.ok(explorationCircuitState(s.save).fuseVisible)
  assert.equal(s.run('explore-take-fuse'),'accepted');assert.equal(explorationCircuitState(s.save).fuseVisible,false)
  assert.equal(s.run('explore-take-fuse'),'rejected');s.reload()
  assert.equal(s.run('explore-insert-light'),'accepted');assert.equal(s.run('explore-observe-stop'),'accepted')
  if(!toolFirst)assert.equal(s.run('explore-take-wedge'),'accepted')
  assert.equal(s.run('explore-take-wedge'),'rejected');assert.equal(explorationCircuitState(s.save).wedgeVisible,false)
  assert.equal(s.run('explore-remove-light'),'accepted');assert.equal(s.run('explore-insert-lock'),'accepted')
  assert.equal(s.run('explore-brace-door'),'accepted');assert.equal(s.run('explore-remove-lock'),'accepted');assert.equal(s.run('explore-enter-signal'),'accepted')
  assert.equal(s.save.inventory.find(i=>i.id==='explore-fuse')!.count,1)
 })
 test(`circuit transfer and braced door preserve one fuse across recovery (${locale})`,()=>{
  const s=setup();assert.equal(s.run('explore-insert-light'),'accepted');assert.ok(explorationCircuitState(s.save).lightOn)
  assert.equal(s.run('explore-observe-stop'),'accepted');s.reload()
  assert.equal(s.run('explore-remove-light'),'accepted');assert.equal(s.run('explore-insert-lock'),'accepted');assert.ok(explorationCircuitState(s.save).doorOpen)
  assert.equal(s.run('explore-brace-door'),'accepted');assert.equal(s.run('explore-remove-lock'),'accepted');s.reload()
  assert.ok(explorationCircuitState(s.save).doorOpen);assert.equal(s.save.inventory.find(i=>i.id==='explore-fuse')!.count,1);assert.equal(s.save.inventory.find(i=>i.id==='explore-wedge')?.count??0,0)
  assert.deepEqual(s.save.partyMemberIds,[])
 })
 test(`door transitions follow power and allow return without recruiting anyone (${locale})`,()=>{
  const s=setup();assert.equal(s.run('explore-enter-signal'),'rejected')
  assert.equal(s.run('explore-insert-lock'),'accepted');assert.equal(s.run('explore-enter-signal'),'accepted')
  assert.equal(s.save.map.find(m=>m.current)?.id,'explore-signal-inside')
  assert.equal(s.run('explore-remove-lock'),'rejected')
  assert.equal(s.run('explore-return-power'),'accepted')
  assert.equal(s.run('explore-remove-lock'),'accepted');assert.equal(s.run('explore-enter-signal'),'rejected')
  assert.deepEqual(s.save.partyMemberIds,[])
 })
 test(`wrong order and duplicate removal do not lose or duplicate items (${locale})`,()=>{
  const s=setup();assert.equal(s.run('explore-insert-lock'),'accepted');assert.equal(s.run('explore-brace-door'),'rejected')
  assert.equal(s.run('explore-insert-light'),'rejected');assert.equal(s.run('explore-remove-lock'),'accepted');assert.equal(explorationCircuitState(s.save).doorOpen,false)
  const before=structuredClone(s.save);assert.equal(s.run('explore-remove-lock'),'rejected');assert.deepEqual(s.save,before)
  assert.equal(s.run('explore-inside-release'),'rejected');s.save.map=[{id:'explore-signal-inside',label:'Inside',current:true,visited:true}];assert.equal(s.run('explore-inside-release'),'accepted');assert.ok(explorationCircuitState(s.save).doorOpen)
  s.save.map=[{id:'explore-power',label:'Power room',current:true,visited:true}];for(let i=0;i<20;i++){assert.equal(s.run('explore-insert-light'),'accepted');assert.equal(s.run('explore-remove-light'),'accepted')}
  assert.equal(s.save.inventory.find(i=>i.id==='explore-fuse')!.count,1)
 })
}
