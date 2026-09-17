import test from 'node:test'
import assert from 'node:assert/strict'
import {nearestInteraction,isInteractionShortcut,stableInteraction} from '../src/nearby-interaction'

test('nearby selection is bounded, stable on ties, and cannot choose absent entities',()=>{
 const entities=[{id:'far',position:{x:80,y:0}},{id:'left',position:{x:-10,y:0}},{id:'right',position:{x:10,y:0}}]
 assert.equal(nearestInteraction(entities,{x:0,y:0},10)?.id,'left')
 assert.equal(nearestInteraction(entities,{x:0,y:0},9),undefined)
 assert.equal(nearestInteraction(entities.slice(0,1),{x:0,y:0},10),undefined)
 assert.equal(nearestInteraction([],{x:0,y:0},100),undefined)
 assert.equal(nearestInteraction(entities,{x:9,y:0},10)?.id,'right')
})
test('interaction does not steal editing, IME, browser chords, held keys or consumed events',()=>{
 const e={key:'e',repeat:false,isComposing:false,defaultPrevented:false,ctrlKey:false,altKey:false,metaKey:false}
 assert.equal(isInteractionShortcut(e,false),true)
 assert.equal(isInteractionShortcut({...e,key:'E'},false),true)
 assert.equal(isInteractionShortcut(e,true),false)
 for(const flag of ['repeat','isComposing','defaultPrevented','ctrlKey','altKey','metaKey'] as const)assert.equal(isInteractionShortcut({...e,[flag]:true},false),false,flag)
 for(const key of ['Enter',' ','Escape','w'])assert.equal(isInteractionShortcut({...e,key},false),false)
})

const neighbours=[{id:'drawer',position:{x:0,y:0}},{id:'cabinet',position:{x:40,y:0}}]
test('nearby focus tolerates small reversals but switches after clear movement',()=>{
 assert.equal(stableInteraction(neighbours,{x:21,y:0},54,'drawer')?.id,'drawer')
 assert.equal(stableInteraction(neighbours,{x:19,y:0},54,'drawer')?.id,'drawer')
 assert.equal(stableInteraction(neighbours,{x:25,y:0},54,'drawer')?.id,'cabinet')
})
test('explicit object intent wins only inside the same strict interaction radius',()=>{
 assert.equal(stableInteraction(neighbours,{x:25,y:0},54,'cabinet','drawer')?.id,'drawer')
 assert.equal(stableInteraction(neighbours,{x:54,y:0},54,'drawer','drawer')?.id,'cabinet')
 assert.equal(stableInteraction(neighbours,{x:94,y:0},54,'cabinet','cabinet'),undefined)
})
test('missing targets and changed scene projections cannot retain old focus',()=>{
 assert.equal(stableInteraction(neighbours.slice(1),{x:20,y:0},54,'drawer','drawer')?.id,'cabinet')
 assert.equal(stableInteraction([],{x:0,y:0},54,'drawer','drawer'),undefined)
})
