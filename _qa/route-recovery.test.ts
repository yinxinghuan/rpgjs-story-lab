import test from 'node:test'
import assert from 'node:assert/strict'
import {findGridPath} from '../src/grid-path'
import {advanceRoute} from '../src/walking-motion'
import {recoverBlockedRoute} from '../src/route-recovery'

test('a changed resident collision reroutes to the same destination without teleport or false arrival',()=>{
 let residentX=100
 const walkable=(p:{x:number;y:number})=>p.x>=0&&p.x+16<=160&&p.y>=0&&p.y+26<=220&&!(p.x<residentX+32&&p.x+16>residentX&&p.y<108&&p.y+26>80)
 const path=(a:{x:number;y:number},b:{x:number;y:number})=>findGridPath(a,b,walkable)
 const destination={x:40,y:8};let position={x:40,y:180},route=path(position,destination),recoveries=0,arrivals=0
 residentX=40 // NPC moved into the route after it was planned.
 for(let tick=0;tick<1000&&route.length;tick++){
  const before=position,result=advanceRoute(position,route,2,walkable)
  position=result.position;route.splice(0,result.consumed)
  assert.ok(walkable(position));assert.ok(Math.hypot(position.x-before.x,position.y-before.y)<=2.000001)
  if(result.blocked){assert.equal(result.arrived,false);route=recoverBlockedRoute(position,route,path,walkable);recoveries++;assert.ok(route.length)}
  if(result.arrived)arrivals++
 }
 assert.equal(recoveries,1);assert.equal(arrivals,1);assert.deepEqual(position,destination)
})

test('a sealed path or an unusable snapped first step does not retain a stuck route',()=>{
 const at={x:20,y:20},destination={x:20,y:0}
 assert.deepEqual(recoverBlockedRoute(at,[destination],()=>[],()=>true),[])
 assert.deepEqual(recoverBlockedRoute(at,[destination],()=>[{x:20,y:19},destination],p=>p.y>=20),[])
 assert.deepEqual(at,{x:20,y:20})
})
