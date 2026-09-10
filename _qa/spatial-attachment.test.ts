import {test} from 'node:test'
import assert from 'node:assert/strict'
import {compileSpatialBinding,type SpatialBindingDefinition,type SpatialStoryDefinition} from '../src/spatial-binding'
import {dryRunSpatialAttachment} from '../src/spatial-attachment'
function fixture(){
 const story:SpatialStoryDefinition={id:'regional-fixture',initialMap:[{id:'station',current:true},{id:'valley'}],characters:[{id:'ada'}],domainRules:{rules:[{id:'enter-cab',effects:[]},{id:'depart',effects:[{type:'map',nodeId:'valley'}]}]}}
 const world:SpatialBindingDefinition={version:1,cartridgeId:story.id,mapVersion:'rooms-1',interactionDistance:30,scenes:[{id:'saloon',storyLocationId:'station',spawn:{x:5,y:5}},{id:'cab',storyLocationId:'station',spawn:{x:6,y:6}},{id:'valley-cab',storyLocationId:'valley',spawn:{x:7,y:7}}],entities:[{id:'door',scene:'saloon',position:{x:10,y:10},approach:{x:10,y:12},states:['open'],actions:['enter-cab']},{id:'controls',scene:'cab',position:{x:10,y:10},approach:{x:10,y:12},states:['ready'],actions:['depart']}],portals:[{actionId:'enter-cab',scene:'cab',position:{x:6,y:6}},{actionId:'depart',scene:'valley-cab',position:{x:7,y:7}}],characters:[{id:'ada',kind:'physical',entities:['controls']}]}
 const binding=compileSpatialBinding(story,world,(_s,p)=>p.x>=0&&p.x<50&&p.y>=0&&p.y<60)
 const save={version:8,cartridgeId:story.id,map:structuredClone(story.initialMap),characters:[{id:'ada',name:'Ada',status:'companion'}],stats:{fuel:54,condition:80,morale:63},inventory:[{id:'master-key',count:1}],facts:{route:'unset'},partyMemberIds:['ada'],relationships:[{id:'kept-promise'}],blocks:[{id:'history-1',text:'An already completed choice.'}],finale:{status:'ready',unlocked:['original-ending']}}
 return {story,world,binding,save}
}
test('one narrative region can contain two rooms without inventing a story map transition',()=>{
 const {binding,save}=fixture(),before=structuredClone(save)
 assert.throws(()=>binding.locate(save),/AMBIGUOUS_SPATIAL_SCENE/)
 assert.deepEqual(binding.assertTransition(save,save,'enter-cab','saloon'),{scene:'cab',position:{x:6,y:6}})
 const valley={...save,map:save.map.map(n=>({...n,current:n.id==='valley'}))}
 assert.deepEqual(binding.assertTransition(save,valley,'depart','cab'),{scene:'valley-cab',position:{x:7,y:7}})
 assert.throws(()=>binding.assertTransition(save,valley,null,'cab'),/UNADMITTED_STORY_TRANSITION/)
 assert.deepEqual(save,before)
})
test('attachment preserves the source engine schema, finale and all story fields byte for byte',()=>{
 const {binding,save}=fixture(),original=JSON.stringify(save)
 const r=dryRunSpatialAttachment(save,binding,{supportedSaveVersion:8,resume:{sceneId:'cab',position:{x:6,y:6}},readySceneIds:['cab'],readyCharacterIds:['ada']})
 assert.equal(r.status,'dry-run-ready');assert.equal(JSON.stringify(r.candidate!.story),original)
 assert.equal(r.candidate!.spatial.sourceSaveVersion,8);assert.equal(r.candidate!.spatial.resume.sceneId,'cab')
 r.candidate!.story.finale.status='changed';r.candidate!.story.characters[0].name='changed'
 assert.equal(JSON.stringify(save),original)
})
test('missing location choice, schema adapter or artwork cannot produce an activation candidate',()=>{
 const {binding,save}=fixture()
 const options={supportedSaveVersion:8,readySceneIds:[],readyCharacterIds:[]}
 assert.ok(dryRunSpatialAttachment(save,binding,options).issues.some(i=>i.code==='AMBIGUOUS_SPATIAL_SCENE'))
 assert.ok(dryRunSpatialAttachment(save,binding,{...options,supportedSaveVersion:10}).issues.some(i=>i.code==='STORY_SCHEMA_REQUIRES_ADAPTER'))
 const r=dryRunSpatialAttachment(save,binding,{...options,resume:{sceneId:'cab',position:{x:6,y:6}}})
 assert.deepEqual(r.issues.map(i=>i.code),['SCENE_ASSETS_NOT_ADMITTED','CHARACTER_PRESENTATION_NOT_ADMITTED']);assert.equal(r.candidate,null)
 assert.ok(dryRunSpatialAttachment(save,binding,{...options,resume:{sceneId:'cab',position:{x:-1,y:6}}}).issues.some(i=>i.code==='INVALID_MIGRATION_POSITION'))
})
