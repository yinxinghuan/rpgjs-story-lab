import type {OldStreetCampaignGenerator} from '../server/old-street-campaign-planner'
/** Explicitly synthetic; never installed by a production entry. */
export const campaignFixture:OldStreetCampaignGenerator=async(context)=>{
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
 return context.locale==='zh'?{title:'修好的小桥',fragment:`「${context.previous.label}」纸袋里保存着一张维修便条。便条记着：洪水过后，邻居们换掉了河边小桥上的三块旧木板，恢复了通向工坊的道路。`}:{title:'The repaired footbridge',fragment:`The packet labelled “${context.previous.label}” holds a repair note. After the flood, neighbours replaced three boards on the footbridge, restoring the path to the workshops.`}
}
