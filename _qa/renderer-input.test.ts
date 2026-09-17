import test from 'node:test'
import assert from 'node:assert/strict'
import {acceptsWorldKey} from '../src/renderer-input'
const key={key:'ArrowRight',defaultPrevented:false,isComposing:false,metaKey:false,ctrlKey:false,altKey:false}
test('walking keys work in the world but not while a focus surface owns input',()=>{
 assert.equal(acceptsWorldKey(key,false,null),true)
 assert.equal(acceptsWorldKey({...key,key:'W'},false,null),true)
 assert.equal(acceptsWorldKey(key,true,null),false)
 assert.equal(acceptsWorldKey({...key,key:'Enter'},false,null),false)
})
test('composition, browser shortcuts and already handled events do not move the hero',()=>{
 for(const modifier of ['defaultPrevented','isComposing','metaKey','ctrlKey','altKey'])assert.equal(acceptsWorldKey({...key,[modifier]:true},false,null),false)
})
test('nested editors and open dialogs own their keys even when renderer pause is released',()=>{
 const insideControl={closest:()=>({} as Element)},outsideControl={closest:()=>null}
 assert.equal(acceptsWorldKey(key,false,insideControl),false)
 assert.equal(acceptsWorldKey(key,false,outsideControl),true)
})
