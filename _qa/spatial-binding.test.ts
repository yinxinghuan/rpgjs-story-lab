import {test} from 'node:test'
import assert from 'node:assert/strict'
import {compileSpatialBinding,type SpatialBindingDefinition,type SpatialStoryDefinition,type SpatialSnapshot} from '../src/spatial-binding'
import {carriageSpatialDefinition,bindCarriageStory} from '../src/carriage-spatial-binding'
import {cartridge,initialStory} from '../src/story'
import {walkable,type EntityId,entities} from '../src/contract'
import {approachPoints,type SceneId} from '../src/scene-layout'
// Pure authoring fixture, not a second shipped game or renderer acceptance.
function fixture(){
 const story:SpatialStoryDefinition={id:'archive-fixture',initialMap:[{id:'atrium',current:true},{id:'stacks'}],characters:[{id:'archivist'},{id:'operator'}],domainRules:{rules:[{id:'read',effects:[]},{id:'ascend',effects:[{type:'map',nodeId:'stacks'}]},{id:'descend',effects:[{type:'map',nodeId:'atrium'}]}]}}
 const world:SpatialBindingDefinition={version:1,cartridgeId:story.id,mapVersion:'archive-3',interactionDistance:20,scenes:[{id:'atrium',spawn:{x:3,y:3}},{id:'stacks',spawn:{x:8,y:8}}],entities:[{id:'desk',scene:'atrium',position:{x:10,y:10},approach:{x:10,y:12},states:['ready'],actions:['read']},{id:'stairs',scene:'atrium',position:{x:40,y:10},approach:{x:40,y:12},states:['open'],actions:['ascend']},{id:'landing',scene:'stacks',position:{x:10,y:10},approach:{x:10,y:12},states:['open'],actions:['descend']}],portals:[{actionId:'ascend',scene:'stacks',position:{x:8,y:8}},{actionId:'descend',scene:'atrium',position:{x:38,y:12}}],characters:[{id:'archivist',kind:'physical',entities:['desk']},{id:'operator',kind:'mediated',entities:['desk','landing']}]}
 const walk=(_scene:string,p:{x:number;y:number})=>p.x>=0&&p.x<60&&p.y>=0&&p.y<80
 const save=(scene:string):SpatialSnapshot=>({cartridgeId:story.id,map:story.initialMap.map(n=>({...n,current:n.id===scene})),characters:[{id:'archivist'}]})
 return {story,world,walk,save,compile:()=>compileSpatialBinding(story,world,walk)}
}
test('runtime cartridge binds every authored action in both languages from real layout',()=>{
 for(const locale of ['zh','en'] as const){
  const c=cartridge(locale),b=bindCarriageStory(c),w=carriageSpatialDefinition()
  assert.deepEqual(b.actionIds().sort(),c.domainRules!.rules.map(r=>r.id).sort())
  for(const [id,e] of Object.entries(entities))for(const action of e.actions)assert.equal(b.admits(action,id,e.scene,approachPoints[id as EntityId]),true)
  assert.equal(b.mapVersion,w.mapVersion);assert.equal(w.characters.filter(c=>c.kind==='mediated').length,1)
 }
})
test('independent binding admits only local reachable interactions and authorizes exact arrival',()=>{
 const f=fixture(),b=f.compile()
 assert.equal(b.admits('read','desk','atrium',{x:10,y:12}),true)
 assert.equal(b.admits('read','desk','stacks',{x:10,y:12}),false)
 assert.equal(b.admits('read','desk','atrium',{x:59,y:70}),false)
 assert.equal(b.admits('read','stairs','atrium',{x:40,y:12}),false)
 const arrival=b.assertTransition(f.save('atrium'),f.save('stacks'),'ascend')!
 assert.deepEqual(arrival,{scene:'stacks',position:{x:8,y:8}})
 arrival.position.x=999;assert.equal(b.assertTransition(f.save('atrium'),f.save('stacks'),'ascend')!.position.x,8)
 f.world.portals[0].position.x=999;assert.equal(b.assertTransition(f.save('atrium'),f.save('stacks'),'ascend')!.position.x,8)
 assert.throws(()=>b.assertTransition(f.save('atrium'),f.save('stacks'),null),/UNADMITTED_STORY_TRANSITION/)
 assert.throws(()=>b.assertTransition(f.save('stacks'),f.save('stacks'),'read'),/PORTAL_SOURCE_MISMATCH/)
})
test('authoring rejects incomplete maps, duplicate bindings and rule-to-portal mismatches',()=>{
 const cases:Array<[(f:ReturnType<typeof fixture>)=>void,RegExp]>=[
  [f=>{f.world.cartridgeId='another'},/CARTRIDGE_MISMATCH/],
  [f=>{f.world.scenes.pop()},/UNBOUND_STORY_SCENE/],
  [f=>{f.world.scenes[0].spawn.x=-1},/INVALID_SPATIAL_SPAWN/],
  [f=>{f.world.entities[0].approach.y=900},/INVALID_ENTITY_APPROACH/],
  [f=>{f.world.entities[1].actions=['read']},/DUPLICATE_ACTION_BINDING/],
  [f=>{f.world.entities[0].actions=['invent-rule']},/MISSING_STORY_RULE/],
  [f=>{f.story.domainRules!.rules=[...f.story.domainRules!.rules,{id:'hidden-teleport',effects:[]}]},/UNBOUND_STORY_ACTION/],
  [f=>{f.world.portals[0].scene='atrium'},/PORTAL_RULE_MISMATCH/],
  [f=>{f.world.portals[0].position.x=-1},/INVALID_PORTAL_BINDING/],
  [f=>{f.world.characters.pop()},/UNBOUND_STORY_CHARACTER/],
  [f=>{f.world.characters[1].entities=['missing-phone']},/INVALID_CHARACTER_BINDING/],
 ]
 for(const [edit,error] of cases){const f=fixture();edit(f);assert.throws(f.compile,error)}
})
test('unmapped characters, foreign saves and ambiguous current maps fail without changing snapshots',()=>{
 const f=fixture(),b=f.compile(),before=f.save('atrium'),after=f.save('atrium')
 after.characters=[{id:'unmade-stranger'}];const copy=structuredClone(after)
 assert.throws(()=>b.assertTransition(before,after,null),/UNREPRESENTABLE_CHARACTER/);assert.deepEqual(after,copy)
 after.characters=[];after.cartridgeId='other-game';assert.throws(()=>b.assertTransition(before,after,null),/SPATIAL_SAVE_MISMATCH/)
 after.cartridgeId=before.cartridgeId;after.map=after.map.map(n=>({...n,current:true}));assert.throws(()=>b.assertTransition(before,after,null),/UNREPRESENTABLE_SCENE/)
 const live=initialStory('zh');assert.throws(()=>b.assertTransition(before,live,null),/SPATIAL_SAVE_MISMATCH/)
})
test('real cartridge invalid portal fails before entering the reducer',()=>{
 const world=carriageSpatialDefinition(),before=initialStory('zh'),copy=structuredClone(before)
 world.portals.find(p=>p.actionId==='leave')!.scene='walkway'
 assert.throws(()=>compileSpatialBinding(cartridge('zh'),world,(s,p)=>walkable(p,s as SceneId)),/PORTAL_RULE_MISMATCH/)
 assert.deepEqual(before,copy)
})
