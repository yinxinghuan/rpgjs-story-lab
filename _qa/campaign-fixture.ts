import type {OldStreetCampaignGenerator} from '../server/old-street-campaign-planner'
import {readFileSync} from 'node:fs'
import {isDeepStrictEqual} from 'node:util'
// Optional immutable provider-output replay for UI inspection only. This can
// include a semantically rejected candidate; it must never be production art.
const replayPath=process.env.OLDSTREET_QA_CAMPAIGN_REPORT
const replay=replayPath?JSON.parse(readFileSync(replayPath,'utf8')):undefined
// Optional separate real geometry sample, overlaid only in this local harness.
const roomPath=process.env.OLDSTREET_QA_ARCHIVE_ROOM_REPORT
const roomReplay=roomPath?JSON.parse(readFileSync(roomPath,'utf8')).cases[Number(process.env.OLDSTREET_QA_ARCHIVE_ROOM_INDEX??1)]?.room:undefined
if(roomPath&&!Array.isArray(roomReplay))throw Error('ROOM_REPLAY_NOT_ACCEPTED')
/** Synthetic by default; explicit report replay never makes network calls.
 * Neither mode is installed by a production entry. */
export const campaignFixture:OldStreetCampaignGenerator=async(context)=>{
 if(replay){const row=replay.cases.find((r:any)=>r.chain===Number(process.env.OLDSTREET_QA_CAMPAIGN_CHAIN??1)&&r.stage===context.stage&&r.accepted!==undefined);if(!row||!isDeepStrictEqual(row.context,context))throw Error('REPLAY_CONTEXT_MISMATCH');return {...structuredClone(row.accepted),...(context.stage==='archive'&&roomReplay?{room:structuredClone(roomReplay)}:{})}}
 if(context.stage==='archive')return {
  title:context.locale==='zh'?'小桥维修记录':'Footbridge work records',layout:'east-index',
  cards:context.locale==='zh'?[{id:'a',label:'装好新木板'},{id:'b',label:'裁切替换木板'},{id:'c',label:'重新开放小桥'},{id:'d',label:'测量损坏的木板'}]:[{id:'a',label:'New boards were fitted'},{id:'b',label:'Replacement boards were cut'},{id:'c',label:'The footbridge reopened'},{id:'d',label:'Damaged boards were measured'}],
  sources:{index:[{before:'d',after:'b'},{before:'a',after:'c'}],ledger:[{before:'b',after:'a'}]},
  discovery:context.locale==='zh'?'两份记录对上了：邻居先测量损坏处，再裁切替换木板；安装完成后，小桥才重新通行。':'The records agree: neighbors measured the damage before cutting replacement boards. The footbridge reopened after the boards were fitted.',
 }
 if(context.stage==='trace')return context.locale==='zh'?{
  title:'寄存记录',clue:{mark:'两道刻痕',wrapping:'麻绳'},records:[
   {label:'工坊维修',mark:'两道刻痕',wrapping:'折叠封口'},
   {label:'屋顶测量',mark:'一道刻痕',wrapping:'麻绳'},
   {label:'街道修缮',mark:'两道刻痕',wrapping:'麻绳'},
  ],
 }:{title:'Filing records',clue:{mark:'two notches',wrapping:'linen cord'},records:[
  {label:'Workshop repairs',mark:'two notches',wrapping:'folded flap'},
  {label:'Roof measurements',mark:'one notch',wrapping:'linen cord'},
  {label:'Street repairs',mark:'two notches',wrapping:'linen cord'},
 ]}
 return context.locale==='zh'?{title:'小桥的一张便条',fragment:`「${context.previous.label}」纸袋里有一张没有日期的便条，记着小桥上换了三块木板。旁边却只有“测量”和“裁切”两个词，事情的经过并没有写全。`,...(context.investigation?{question:'替换木板是在测量损坏处之前，还是之后裁切的？'}:{})}:{title:'A note from the footbridge',fragment:`The packet labelled “${context.previous.label}” holds an undated note: three boards were replaced on the footbridge. It lists “measurement” and “cutting” without explaining their order.`,...(context.investigation?{question:'Were the replacement boards cut before or after the damage was measured?'}:{})}
}
