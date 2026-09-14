export type StoryBeat={id:string;text:string;speaker?:string;kind:string;data?:{originalRole?:unknown;transitionAnchor?:unknown}}
/** Mechanical receipts accompany the outcome; they never consume a dialogue page. */
export function storyReceipts(blocks:readonly StoryBeat[],previous:readonly {id:string}[]=[]):StoryBeat[]{
 const seen=new Set(previous.map(b=>b.id))
 return blocks.filter(b=>!seen.has(b.id)&&b.text.trim()&&(b.kind==='change'||b.kind==='check'||(b.kind==='event'&&/^effect-\d+-\d+$/.test(b.id))))
}
/** Presentation-only segmentation of the original text. No summary, model call,
 * state mutation or speaker invention. History retains the complete blocks. */
export function storyBeats(blocks:readonly StoryBeat[],locale:'zh'|'en',previous:readonly {id:string}[]=[]):StoryBeat[]{
 const seen=new Set(previous.map(b=>b.id)),limit=locale==='zh'?72:180,result:StoryBeat[]=[]
 const segmenter=new Intl.Segmenter(locale,{granularity:'sentence'})
 for(const block of blocks){
  if(block.kind==='image'||block.kind==='change'||block.kind==='check'||(block.kind==='event'&&/^effect-\d+-\d+$/.test(block.id))||(block.kind==='narration'&&block.data?.transitionAnchor!==undefined&&/^transition-\d+$/.test(block.id))||seen.has(block.id)||block.data?.originalRole==='player'||block.id.startsWith('action-')||!block.text.trim())continue
  let text='',sentences=0,index=0
  const flush=()=>{if(text.trim())result.push({...block,id:block.id+':'+index++,text:text.trim()});text='';sentences=0}
  for(const {segment} of segmenter.segment(block.text)){
   if(text&&(sentences>=2||text.length+segment.length>limit))flush()
   let rest=segment
   while(rest.length>limit){let at=limit;if(locale==='en'){const space=rest.lastIndexOf(' ',limit);if(space>limit/2)at=space+1}text=rest.slice(0,at);flush();rest=rest.slice(at)}
   text+=rest;sentences++
  }
  flush()
 }
 return result
}
