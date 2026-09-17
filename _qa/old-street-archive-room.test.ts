import test from 'node:test'
import assert from 'node:assert/strict'
import {archiveRoomLayout,readArchiveRoom} from '../src/old-street-archive-room'
import {archiveLayoutFromFacts,archiveEventSlots} from '../src/old-street-archive'
import {oldStreetSpatialPlan,oldStreetPath,oldStreetWalkable} from '../src/old-street-space'
import {createOldStreetCampaignPlanner} from '../server/old-street-campaign-planner'
import {compileLinkedParcel} from '../src/old-street-campaign'
export const roomA=['I...L','.....','.SS..','.....','...S.','.Tt..','.....','.....','.....']
const roomB=['..I..','.....','S..L.','.....','.SS..','.....','..Tt.','.....','.....']

test('fresh inquiry generation requires reachable physical content without rewriting older saved layouts',async()=>{
 const previous={label:'Sidewalk repairs',mark:'blue ink',wrapping:'string'}
 const papers=compileLinkedParcel({title:'Street records',fragment:'The records mention sidewalk repairs and a power outage.',otherEvent:'A power outage'},previous,'en')
 const context={stage:'archive' as const,locale:'en' as const,previous,papers}
 const draft={title:'Street work',layout:'west-index',middleEvents:['Crews inspected the damaged pavement','Replacement stones were delivered'],earlier:'second'}
 const signal=new AbortController().signal
 await assert.rejects(createOldStreetCampaignPlanner(async()=>draft)(context,signal),/ARCHIVE_ROOM_REQUIRED/)
 await assert.rejects(createOldStreetCampaignPlanner(async()=>({...draft,room:['I...L','.....','SSSSS','.....','.....','.Tt..','.....','.....','.....']}))(context,signal),/ARCHIVE_ROOM_UNREACHABLE/)
 const content=await createOldStreetCampaignPlanner(async()=>({...draft,room:roomA}))(context,signal) as {room:string[]}
 assert.deepEqual(content.room,roomA)
 assert.equal(archiveLayoutFromFacts({'archive-layout':'west-index'}).props.length,3)
})

test('authored cells project into the real collision and interaction graph with different routes',()=>{
 const routes=[]
 for(const room of [roomA,roomB]){
  const facts={'archive-ready':true,'archive-layout':'west-index','archive-room':JSON.stringify(readArchiveRoom(room))}
  const layout=archiveLayoutFromFacts(facts),binding=oldStreetSpatialPlan({facts})
  assert.equal(layout.props.length,6)
  assert.equal(binding.entities.filter(e=>e.scene==='archive'&&e.id.startsWith('archive-')).length,3,'storage is physical scenery, not empty interaction targets')
  for(const prop of layout.props){
   assert.equal(oldStreetWalkable('archive',prop.body,{facts}),false,'every rendered body blocks movement')
   if(prop.id.startsWith('archive-storage-'))continue
   const out=oldStreetPath('archive',layout.arrival,prop.approach,{facts}),back=oldStreetPath('archive',prop.approach,layout.arrival,{facts})
   assert.ok(out.length>0);assert.ok(back.length>0)
   assert.deepEqual(binding.entities.find(e=>e.id===prop.id)?.approach,prop.approach)
   if(prop.id==='archive-index')routes.push(out)
  }
  assert.deepEqual(archiveLayoutFromFacts(JSON.parse(JSON.stringify(facts))),layout,'reload never regenerates positions')
 }
 assert.notDeepEqual(routes[0],routes[1])
})

test('unreachable evidence and malformed furniture cannot open a generated room; old layouts remain intact',()=>{
 assert.throws(()=>readArchiveRoom(['I...L','.....','SSSSS','.....','.....','.Tt..','.....','.....','.....']),/UNREACHABLE/)
 assert.throws(()=>readArchiveRoom(['I...L','.....','.....','.....','.....','.T.t.','.....','.....','.....']),/INVALID/)
 assert.throws(()=>readArchiveRoom([...roomA,'.....']),/INVALID/)
 assert.throws(()=>readArchiveRoom(roomA.map(r=>r.replace('L','I'))),/INVALID/)
 assert.equal(archiveLayoutFromFacts({'archive-layout':'west-index'}).props[0].body.x,112)
 assert.equal(archiveLayoutFromFacts({'archive-layout':'east-index'}).props[0].body.x,224)
 assert.equal(archiveEventSlots().length,9,'all possible renderer slots exist before generation')
})
