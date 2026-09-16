import type {StoryBlock} from './vendor/original-train/types'
/** Presentation only. Preserve every non-player sentence in order; the authority
 * keeps the original blocks. A page change never submits a story action. */
export function oldStreetDialoguePages(blocks:StoryBlock[],locale:'zh'|'en'){
 const limit=locale==='zh'?64:180
 return blocks.filter(b=>b.data?.oldStreetRole!=='player').flatMap(block=>{
  const tokens=locale==='zh'?Array.from(block.text):block.text.match(/\S+\s*|\s+/gu)??[]
  const pages:string[]=[];let page=''
  for(const token of tokens){
   if(page&&page.length+token.length>limit){pages.push(page);page=''}
   page+=token
  }
  if(page)pages.push(page)
  return pages.map((text,index)=>({...block,id:block.id+':page:'+index,text}))
 })
}
