import test from 'node:test'
import assert from 'node:assert/strict'
import {stationRooms,stationConnections,stationCrossingId,stationDoorId,stationSpatialPlan,stationTravelRules,bindStationLayout} from '../src/exploration-station-plan'

test('every passage returns through the corresponding doorway rather than a generic spawn',()=>{
 const plan=stationSpatialPlan(),binding=bindStationLayout('zh')
 for(const {a,b} of stationConnections)for(const [from,to] of [[a,b],[b,a]]){
  const portal=plan.portals.find(p=>p.actionId===stationCrossingId(from))!
  assert.equal(portal.scene,to.room);assert.deepEqual(portal.position,to.approach)
  assert.ok(binding.admits(portal.actionId,stationDoorId(from),from.room,from.approach))
  assert.equal(binding.admits(portal.actionId,stationDoorId(to),from.room,from.approach),false)
  const snapshot=(room:string)=>({cartridgeId:plan.cartridgeId,map:stationRooms.map(id=>({id,current:id===room})),characters:[]})
  assert.deepEqual(binding.assertTransition(snapshot(from.room),snapshot(to.room),portal.actionId,from.room),{scene:to.room,position:to.approach})
 }
 assert.equal(stationTravelRules('en').length,12)
})
test('platform offers both branches and the carriages form a returnable loop',()=>{
 const destinations=(room:string)=>stationConnections.flatMap(c=>c.a.room===room?[c.b.room]:c.b.room===room?[c.a.room]:[])
 assert.ok(destinations('station-platform').includes('station-waiting'));assert.ok(destinations('station-platform').includes('station-tools'))
 const loop=['station-carriage-07','station-carriage-06','station-platform','station-carriage-07']
 for(let i=1;i<loop.length;i++)assert.ok(destinations(loop[i-1]).includes(loop[i] as any))
 const seen=new Set<string>([stationRooms[0]]),queue=[...seen]
 for(const room of queue)for(const next of destinations(room))if(!seen.has(next)){seen.add(next);queue.push(next)}
 assert.equal(seen.size,stationRooms.length)
})

import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {lastTrainToDawn} from '../src/vendor/original-train/cartridges/lastTrainToDawn'
import {prepareStationTravel} from '../src/exploration-station-travel'
test('revisiting the branch loop changes location without advancing story acts or clearing choices',()=>{
 const cartridge={...lastTrainToDawn,id:'station-exploration',initialMap:stationRooms.map((id,i)=>({id,label:id,current:i===0,visited:i===0})),characters:[],initialPartyMemberIds:[],domainRules:{rules:stationTravelRules('zh')}}
 let save=createInitialSave(cartridge);save.choices=[{id:'unfinished-clue',label:'Investigate the unfinished clue'}]
 const original=structuredClone(save)
 const route=['station-carriage-06','station-platform','station-tools','station-platform','station-waiting','station-signal','station-waiting','station-platform','station-carriage-07']
 for(const next of route){
  const from=save.map.find(n=>n.current)!.id,connection=stationConnections.find(c=>c.a.room===from&&c.b.room===next||c.b.room===from&&c.a.room===next)!,door=connection.a.room===from?connection.a:connection.b
  save=prepareStationTravel(save,cartridge,{actionId:stationCrossingId(door),target:stationDoorId(door),scene:from,position:door.approach}).save
 }
 assert.equal(save.map.find(n=>n.current)!.id,'station-carriage-07')
 for(const key of ['scene','time','facts','stats','inventory','partyMemberIds','choices','blocks','finale'] as const)assert.deepEqual(save[key],original[key],key+' must not change during ordinary travel')
 assert.ok(save.map.every(n=>n.visited))
})
