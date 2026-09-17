import test from 'node:test'
import assert from 'node:assert/strict'
import {composeArchiveRoom} from '../server/old-street-room-composer'
import {archiveRoomLayout} from '../src/old-street-archive-room'
import {oldStreetPath,oldStreetWalkable} from '../src/old-street-space'

test('spatial intent produces varied real rooms with exact furniture count, clear approaches and saved geometry',()=>{
 const distinct=new Set<string>()
 for(const indexSide of ['left','right'] as const)for(const rack of ['none','left','right'] as const)for(const storageShelves of [0,1,2,3])for(const seed of [0,1,17,4294967295]){
  const plan={indexSide,rack,storageShelves},result=composeArchiveRoom(plan,seed)
  assert.deepEqual(composeArchiveRoom(plan,seed),result,'seeded generation is repeatable, not repeated at load')
  distinct.add(result.room.join('/'))
  const initial=archiveRoomLayout(result.room)
  assert.equal(result.room.join('').split('S').length-1,storageShelves)
  const index=initial.props.find(p=>p.id==='archive-index')!
  assert.equal(indexSide==='left'?index.body.x<172:index.body.x>172,true)
  assert.equal(!!initial.slide,rack!=='none')
  if(initial.slide)assert.equal(initial.slide.to.x<initial.slide.from.x,rack==='left')
  for(const shifted of [false,true]){
   const facts={'archive-ready':true,'archive-room':JSON.stringify(result.room),'archive-rack-shifted':shifted}
   const placed=archiveRoomLayout(result.room,shifted)
   for(const p of placed.props.filter(p=>!p.id.startsWith('archive-storage-')&&!(placed.indexBlocked&&p.id==='archive-index'))){
    assert.equal(oldStreetWalkable('archive',p.approach,{facts}),true)
    assert.ok(oldStreetPath('archive',placed.arrival,p.approach,{facts}).length)
   }
  }
 }
 assert.ok(distinct.size>40,'not one or two fixed layout templates')
})

test('unknown or unbounded room requests cannot enter the composer',()=>{
 for(const plan of [null,{indexSide:'left',storageShelves:99,rack:'none'},{indexSide:'left',storageShelves:1,rack:'up'},{indexSide:'right',storageShelves:1,rack:'left',newExit:'roof'}])assert.throws(()=>composeArchiveRoom(plan),/ARCHIVE_ROOM_PLAN_INVALID/)
})
