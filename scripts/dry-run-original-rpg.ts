/** Reads source modules only and constructs synthetic saves in memory. No stored
 * journeys, credentials, enrollment, network or production import is involved. */
import {resolve,join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {bindCarriageStory} from '../src/carriage-spatial-binding'
import {cartridge} from '../src/story'
import {dryRunSpatialAttachment} from '../src/spatial-attachment'
const root=process.argv[2]
if(!root)throw Error('Pass the existing last-train-to-dawn source directory; no save file is accepted')
const source=resolve(root),load=(path:string)=>import(pathToFileURL(join(source,path)).href)
const original=await load('src/story/cartridges/lastTrainToDawn.ts'),reducer=await load('src/story/engine/reducer.ts'),turn=await load('src/story/engine/executeTurn.ts')
const fingerprints=Object.fromEntries(['src/story/cartridges/lastTrainToDawn.ts','src/story/types.ts','src/story/engine/reducer.ts','src/story/engine/executeTurn.ts'].map(p=>[p,createHash('sha256').update(readFileSync(join(source,p))).digest('hex')]))
const results=[]
for(const locale of ['zh','en'] as const){
 const c=locale==='zh'?original.lastTrainToDawn:original.lastTrainToDawnEn
 let save=reducer.createInitialSave(c),stage='opening'
 for(const actionId of [null,'repair-starter','salvage-fuel-shed','commit-valley-route']){
  if(actionId){
   const rule=c.domainRules.rules.find((r:any)=>r.id===actionId);assert.ok(rule)
   const result=await turn.executeStoryTurn({save,cartridge:c,action:rule.match[0],generator:{send:async()=>{throw Error('SYNTHETIC_AUTHORED_ONLY')}}})
   assert.equal(result.source,'domain');save=result.save;stage=actionId
  }
  const before=JSON.stringify(save)
  const audit=dryRunSpatialAttachment(save,bindCarriageStory(cartridge(locale)),{supportedSaveVersion:10,readySceneIds:[],readyCharacterIds:[]})
  assert.equal(audit.status,'not-ready');assert.equal(audit.candidate,null);assert.equal(JSON.stringify(save),before)
  assert.ok(audit.issues.some(i=>i.code==='CARTRIDGE_ID_MISMATCH'))
  results.push({locale,stage,sourceVersion:save.version,currentLocations:save.map.filter((n:any)=>n.current).map((n:any)=>n.id),knownCharacters:save.characters.map((c:any)=>c.id),inventory:save.inventory.map((i:any)=>({id:i.id,count:i.count})),statIds:Object.keys(save.stats),historyBlocks:save.blocks.length,hasFinale:Object.hasOwn(save,'finale'),hasJobs:Object.hasOwn(save,'jobs'),sourceUnchanged:true,...audit})
 }
}
const c=original.lastTrainToDawn
const catalog={characters:c.characters.map((p:any)=>({id:p.id,name:p.name,role:p.role,hiddenUntilIntroduced:Boolean(p.hiddenUntilIntroduced)})),locations:c.initialMap.map((p:any)=>({id:p.id,label:p.label})),stats:c.statDefinitions.map((p:any)=>({id:p.id,label:p.label})),initialItems:c.initialInventory.map((p:any)=>({id:p.id,label:p.label})),rules:c.domainRules.rules.map((p:any)=>p.id)}
console.log(JSON.stringify({kind:'synthetic-source-mapping-dry-run',sourceCartridgeId:'last-train-to-dawn',targetCartridgeId:'carriage-07',sourceFiles:fingerprints,catalog,results,verdict:'current-carriage-world-is-not-an-original-save-migration-target',requiredWork:['preserve original cartridge and engine state rather than renaming identities','bind railway regions to explicit interior rooms','retain original finale semantics or implement a verified schema adapter','prepare original characters and regions before spatial activation'],writes:0,networkCalls:0},null,2))
