import {test} from 'node:test'
import assert from 'node:assert/strict'
import {executeBoundStoryTurn} from '../src/bound-story-turn'
import {compileSpatialBinding,type SpatialBindingDefinition} from '../src/spatial-binding'
function setup(){
 const story={id:'original-adapter-fixture',initialMap:[{id:'station',current:true},{id:'valley'}],characters:[{id:'engineer'}],domainRules:{rules:[{id:'key',effects:[]},{id:'depart',effects:[{type:'map',nodeId:'valley'}]}]}}
 const world:SpatialBindingDefinition={version:1,cartridgeId:story.id,mapVersion:'geometry-1',actionScope:'scene',interactionDistance:20,scenes:[{id:'cab-station',storyLocationId:'station',spawn:{x:5,y:5}},{id:'cab-valley',storyLocationId:'valley',spawn:{x:5,y:5}}],entities:[{id:'control-station',scene:'cab-station',position:{x:10,y:10},approach:{x:10,y:15},states:['ready'],actions:['key','depart']},{id:'control-valley',scene:'cab-valley',position:{x:10,y:10},approach:{x:10,y:15},states:['ready'],actions:['key']}],portals:[{actionId:'depart',scene:'cab-valley',position:{x:5,y:5}}],characters:[{id:'engineer',kind:'physical',travels:true,entities:['control-station','control-valley']}]}
 const walk=(_s:string,p:{x:number;y:number})=>p.x>=0&&p.x<50&&p.y>=0&&p.y<50
 const binding=compileSpatialBinding(story,world,walk),save={version:8,cartridgeId:story.id,map:structuredClone(story.initialMap),characters:[{id:'engineer'}],finale:{phase:'idle',candidate:null},facts:{used:0}}
 return {story,world,walk,binding,save,options:{save,binding,sceneId:'cab-station',target:'control-station',position:{x:10,y:15},assertPresentation:()=>{}}}
}
test('scene-scoped actions and travelling characters resolve only in the explicit current room',()=>{
 const f=setup(),b=f.binding
 assert.throws(()=>b.targetFor('key'),/AMBIGUOUS_ACTION_TARGET/)
 assert.equal(b.targetFor('key','cab-valley'),'control-valley')
 assert.equal(b.admits('key','control-station','cab-valley',{x:10,y:15}),false)
 assert.deepEqual(b.characterEntities('engineer','cab-valley'),['control-valley'])
 f.world.entities.push({...f.world.entities[0],id:'duplicate'});assert.throws(()=>compileSpatialBinding(f.story,f.world,f.walk),/DUPLICATE_ACTION_BINDING/)
})
test('global binding remains strict and physical projections cannot duplicate within a room',()=>{
 const f=setup();delete f.world.actionScope;assert.throws(()=>compileSpatialBinding(f.story,f.world,f.walk),/DUPLICATE_ACTION_BINDING/)
 const g=setup();g.world.characters[0].travels=false;assert.throws(()=>compileSpatialBinding(g.story,g.world,g.walk),/AMBIGUOUS_PHYSICAL_CHARACTER/)
 const h=setup();h.world.entities.push({...h.world.entities[0],id:'person-two',actions:[]});h.world.characters[0].entities=['control-station','person-two'];assert.throws(()=>compileSpatialBinding(h.story,h.world,h.walk),/AMBIGUOUS_PHYSICAL_CHARACTER/)
})
test('same rule on two rooms needs explicit portal source and matching destination from each',()=>{
 const f=setup();f.world.portals.push({actionId:'key',scene:'cab-station',position:{x:5,y:5}})
 assert.throws(()=>compileSpatialBinding(f.story,f.world,f.walk),/INVALID_PORTAL_BINDING/)
 f.world.portals[1].fromScene='cab-valley';assert.throws(()=>compileSpatialBinding(f.story,f.world,f.walk),/PORTAL_RULE_MISMATCH/)
})
test('adapter preserves original schema and finale while returning a detached authoritative arrival',async()=>{
 const f=setup(),before=structuredClone(f.save)
 let engineSave:typeof f.save|undefined
 const out=await executeBoundStoryTurn({...f.options,execute:async(save,admit)=>{admit('depart');engineSave=save;save.map=save.map.map(n=>({...n,current:n.id==='valley'}));return {save,acceptedActionId:'depart'}}})
 assert.deepEqual(f.save,before);assert.equal(out.sceneId,'cab-valley');assert.deepEqual(out.position,{x:5,y:5});assert.deepEqual(out.result.save.finale,before.finale)
 engineSave!.facts.used=99;assert.equal(out.result.save.facts.used,0)
})
test('rejected actions do not use portal arrival and presentation checks cannot mutate candidate',async()=>{
 const f=setup()
 const out=await executeBoundStoryTurn({...f.options,execute:async(save,admit)=>{admit('depart');return {save,acceptedActionId:null}},assertPresentation:(_before,after)=>{after.facts.used=999}})
 assert.equal(out.sceneId,'cab-station');assert.deepEqual(out.position,f.options.position);assert.equal(out.result.save.facts.used,0)
})
test('unadmitted action, teleport, schema change and missing presentation all prevent a candidate',async()=>{
 for(const mode of ['action','map','schema','presentation']){
  const f=setup(),before=structuredClone(f.save)
  await assert.rejects(executeBoundStoryTurn({...f.options,execute:async save=>{if(mode==='schema')save.version=10;if(mode==='map')save.map=save.map.map(n=>({...n,current:n.id==='valley'}));return {save,acceptedActionId:mode==='action'?'key':null}},assertPresentation:()=>{if(mode==='presentation')throw Error('ART_NOT_ADMITTED')}}))
  assert.deepEqual(f.save,before)
 }
})
test('off-scene or distant interactions fail before engine execution and admission closes after await',async()=>{
 const f=setup();let calls=0,late:((id:string)=>boolean)|undefined
 await assert.rejects(executeBoundStoryTurn({...f.options,target:'control-valley',execute:async save=>{calls++;return {save,acceptedActionId:null}}}),/INTERACTION_NOT_ADMITTED/)
 await assert.rejects(executeBoundStoryTurn({...f.options,position:{x:45,y:45},execute:async save=>{calls++;return {save,acceptedActionId:null}}}),/INTERACTION_NOT_ADMITTED/)
 assert.equal(calls,0)
 await executeBoundStoryTurn({...f.options,execute:async(save,admit)=>{late=admit;return {save,acceptedActionId:null}}})
 assert.throws(()=>late!('key'),/ACTION_NOT_ADMITTED/)
})
