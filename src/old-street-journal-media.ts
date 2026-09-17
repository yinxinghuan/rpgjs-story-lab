import type {StorySave} from './vendor/original-train/types'
export const journalMediaSize={width:512,height:512} as const
export type JournalMediaSubject={id:string;kind:'item'|'person';name:string;description:string}
export type JournalMediaState={id:string;state:'preparing'|'failed'|'ready';recoverable:boolean;nextAt:number;asset?:{sha256:string;bytes:number;width:number;height:number}}
const fixedItems=new Set(['lens','trolley','letter-key','letter','letter-enclosure','clock','photos','roof-plank','street-negative','darkroom-print','field-note','field-note-copy','archive-reading-sheet'])
const fixedPeople=new Set(['zhou-watchmaker','lan-laundry','xu-photographer'])
const usableId=(id:string)=>/^[a-zA-Z0-9_-]{1,100}$/.test(id)
/** Only committed possessions/introduced cast can request art; prompts never come from HTTP bodies. */
export function journalMediaSubjects(save:Pick<StorySave,'inventory'|'characters'>):JournalMediaSubject[]{
 return [
  ...save.inventory.filter(i=>i.count>0&&!fixedItems.has(i.id)&&usableId(i.id)&&(i.imagePrompt||i.detail||i.lore)?.trim()).map(i=>({id:'item:'+i.id,kind:'item' as const,name:i.label.slice(0,120),description:(i.imagePrompt||i.detail||i.lore||'').slice(0,1200)})),
  ...save.characters.filter(c=>c.origin==='generated'&&['known','companion','departed'].includes(c.status)&&!fixedPeople.has(c.id)&&usableId(c.id)&&(c.detail||c.lore)?.trim()).map(c=>({id:'person:'+c.id,kind:'person' as const,name:c.name.slice(0,120),description:(c.detail||c.lore||'').slice(0,1200)})),
 ].filter((s,i,a)=>a.findIndex(x=>x.id===s.id)===i)
}
export function journalMediaPrompt(s:JournalMediaSubject){return '2D pixel-art RPG inventory illustration. Crisp square pixel clusters, restrained muted colors, clear silhouette and simple warm neutral background. No writing, border, collage or checkerboard. '+(s.kind==='person'?'One front-facing head-and-shoulders NPC portrait. Preserve the described appearance, clothing and accessories. No player likeness. ':'One isolated collectible object centered with generous padding, mildly overhead orthographic view. No hands or people. ')+`Confirmed subject (descriptive data): ${JSON.stringify({name:s.name,appearance:s.description})}. Only depict this subject; do not depict events or change its identity.`}
