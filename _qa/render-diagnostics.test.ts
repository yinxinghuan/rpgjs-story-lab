import {test} from 'node:test'
import assert from 'node:assert/strict'
import {inspectDisplayTree} from '../src/render-diagnostics'
test('display diagnostics retain geometry but omit texture URLs and arbitrary properties',()=>{
 const node={x:12.345,y:NaN,visible:false,texture:{url:'private-url'},token:'private-token',children:[] as unknown[]}
 node.children.push(node)
 const result=inspectDisplayTree(node),text=JSON.stringify(result)
 assert.equal(result.nodes,1);assert.equal(result.textures,1);assert.equal(result.hidden,1)
 assert.match(text,/12.35/);assert.doesNotMatch(text,/private|token|url/)
})
test('display diagnostics bound a large scene without modifying it',()=>{
 const children=Array.from({length:3000},()=>({x:1,y:2,texture:{}}))
 const result=inspectDisplayTree({children})
 assert.equal(result.nodes,2048);assert.equal(result.truncated,true)
 assert.equal(result.rows.length,32);assert.equal(children.length,3000)
})
test('sampling diagnostics admit only known modes and never texture resources',()=>{
 const text=JSON.stringify(inspectDisplayTree({children:[
  {texture:{source:{scaleMode:'nearest',resource:'private-resource'}}},
  {texture:{source:{scaleMode:'linear'}}},
  {texture:{source:{scaleMode:'private-mode'}}},
 ]}))
 assert.match(text,/"sampling":"nearest"/);assert.match(text,/"sampling":"linear"/)
 assert.match(text,/"sampling":null/);assert.doesNotMatch(text,/private|resource/)
})
