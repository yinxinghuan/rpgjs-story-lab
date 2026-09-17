import test from 'node:test'
import assert from 'node:assert/strict'
import {archiveRoomLayout,readArchiveRoom} from '../src/old-street-archive-room'
import {archiveLayoutFromFacts,archiveEventSlots,readArchiveContent} from '../src/old-street-archive'
import {oldStreetSpatialPlan,oldStreetPath,oldStreetWalkable,bindOldStreet} from '../src/old-street-space'
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
 const content=await createOldStreetCampaignPlanner(async(_system,user)=>'candidate' in JSON.parse(user)?{valid:true,issues:[]}:{...draft,room:roomA})(context,signal) as {room:string[]}
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
 assert.equal(archiveEventSlots().length,10,'all possible renderer slots exist before generation')
})

test('moving a rack opens the actual index approach, changes collision and preserves a reversible walking route',()=>{
 for(const pair of ['.mM..','..Mm.']){
  const room=['..I..',pair,'.....','....L','.....','.Tt..','.....','.....','.....']
  const facts={'archive-ready':true,'archive-room':JSON.stringify(readArchiveRoom(room))}
  const before=archiveRoomLayout(room),after=archiveRoomLayout(room,true)
  const index=before.props.find(p=>p.id==='archive-index')!,rack=before.props.find(p=>p.id==='archive-rack')!,parked=after.props.find(p=>p.id==='archive-rack')!
  assert.equal(oldStreetWalkable('archive',index.approach,{facts}),false)
  assert.equal(oldStreetSpatialPlan({facts}).entities.some(p=>p.id==='archive-index'),false)
  assert.ok(bindOldStreet('en',{facts}).canInteract('archive-rack','archive',rack.approach))
  const moved={...facts,'archive-rack-shifted':true}
  assert.equal(oldStreetWalkable('archive',index.approach,{facts:moved}),true)
  assert.equal(oldStreetWalkable('archive',parked.body,{facts:moved}),false)
  assert.ok(bindOldStreet('en',{facts:moved}).canInteract('archive-index','archive',index.approach))
  assert.ok(oldStreetPath('archive',rack.approach,index.approach,{facts:moved}).length)
  assert.ok(oldStreetPath('archive',index.approach,parked.approach,{facts:moved}).length)
  assert.ok(oldStreetPath('archive',parked.approach,before.arrival,{facts}).length,'restoring the rack cannot strand its operator')
 }
 assert.throws(()=>readArchiveRoom(['..I..','..M..','..m..','....L','.....','.Tt..','.....','.....','.....']),/INVALID/,'parking is horizontal and adjacent')
 assert.throws(()=>readArchiveRoom(['I....','..Mm.','.....','....L','.....','.Tt..','.....','.....','.....']),/NOT_BLOCKING/,'rack must create real access work')
})


test('alternating access requires actual movement and keeps a route back in each configuration',()=>{
 const room=['.IL..','.Mm..','.....','.....','...S.','.Tt..','.....','.....','.....']
 for(const shifted of [false,true]){
  const state=archiveRoomLayout(room,shifted),facts={'archive-ready':true,'archive-room':JSON.stringify(room),'archive-rack-shifted':shifted}
  const blocked=shifted?'archive-ledger':'archive-index',open=shifted?'archive-index':'archive-ledger'
  assert.equal(state.alternating,true)
  assert.ok(!oldStreetSpatialPlan({facts}).entities.some(e=>e.id===blocked))
  const openProp=state.props.find(p=>p.id===open)!,blockedProp=state.props.find(p=>p.id===blocked)!,rack=state.props.find(p=>p.id==='archive-rack')!
  assert.equal(oldStreetWalkable('archive',blockedProp.approach,{facts}),false)
  assert.ok(oldStreetPath('archive',state.arrival,openProp.approach,{facts}).length)
  assert.ok(oldStreetPath('archive',openProp.approach,rack.approach,{facts}).length)
  const reversed={...facts,'archive-rack-shifted':!shifted}
  assert.ok(oldStreetPath('archive',rack.approach,state.arrival,{facts:reversed}).length,'operator can still leave after reversing')
 }
})


test('alternating shelf access cannot conceal an off-site loan behind an empty shelf',()=>{
 const room=['.IL..','.Mm..','.....','.....','...S.','.Tt..','.....','.....','.....']
 const content={title:'Archive',layout:'west-index',room,cards:[{id:'a',label:'Survey'},{id:'b',label:'Boards cut'},{id:'c',label:'Boards fitted'},{id:'d',label:'Bridge open'}],sources:{index:[{before:'a',after:'b'}],ledger:[{before:'b',after:'c'},{before:'c',after:'d'}]},discovery:'The bridge was surveyed and repaired.'}
 assert.ok(readArchiveContent(content))
 for(const ledgerSite of ['photo','laundry'])assert.throws(()=>readArchiveContent({...content,ledgerSite}),/alternating access requires/)
})
