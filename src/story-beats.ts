export type StoryBeat={id:string;text:string;speaker?:string;kind:string;data?:{originalRole?:unknown}}
/** Presentation-only segmentation of the original text. No summary, model call,
 * state mutation or speaker invention. History retains the complete blocks. */
export function storyBeats(blocks:readonly StoryBeat[],locale:'zh'|'en',previous:readonly {id:string}[]=[]):StoryBeat[]{
 const seen=new Set(previous.map(b=>b.id)),limit=locale==='zh'?72:180,result:StoryBeat[]=[]
 const segmenter=new Intl.Segmenter(locale,{granularity:'sentence'})
 for(const block of blocks){
  if(seen.has(block.id)||block.data?.originalRole==='player'||block.id.startsWith('action-')||!block.text.trim())continue
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
