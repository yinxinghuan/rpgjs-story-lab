import type {OldStreetHead} from './old-street-head'
export type FieldContent={title:string;target:'drawer'|'viewing-table';finding:string}
export type FieldProgress={id:string;content:FieldContent;observed:boolean;disposition?:'take'|'leave';copy?:{title:string;finding:string}}
export const fieldSites={drawer:{room:'shop',label:['修表铺抽屉','the watch-shop drawer']},'viewing-table':{room:'photo',label:['照相馆放大台','the studio viewing table']}} as const
export function readFieldContent(raw:unknown):FieldContent{
 const r=raw as FieldContent
 if(!r||typeof r!=='object'||Object.keys(r).sort().join(',')!=='finding,target,title'||!Object.hasOwn(fieldSites,r.target))throw Error('CAMPAIGN_FIELD_INVALID')
 for(const [value,max] of [[r.title,60],[r.finding,300]] as const)if(typeof value!=='string'||!value.trim()||value.length>max||/[<>\u0000-\u001f]/.test(value))throw Error('CAMPAIGN_FIELD_INVALID')
 return {title:r.title.trim(),target:r.target,finding:r.finding.trim()}
}
export function fieldLead(field:FieldProgress,locale:'zh'|'en'){
 const label=fieldSites[field.content.target].label[locale==='zh'?0:1]
 if(field.observed)return locale==='zh'?`你沿交叉索引，在${label}找到了补充便笺。`:`You followed the cross-reference and found the supplementary note at ${label}.`
 return locale==='zh'?`交叉索引指向${label}的一张补充便笺。去那里看看，它解释了这件事留下的一个取舍。`:`The cross-reference points to a supplementary note at ${label}. Find it to learn about a choice left by these events.`
}
export type FieldSelection='read'|'take'|'leave'|'copy'|'return'|'borrow'
export function fieldChoices(h:OldStreetHead,target:string){
 const f=h.campaign?.field,t=(zh:string,en:string)=>h.save.locale==='zh'?zh:en
 if(!f||h.save.facts.departed)return []
 const atSource=target===f.content.target&&h.sceneId===fieldSites[f.content.target].room&&(target!=='drawer'||h.save.facts['drawer-open'])
 const atTable=target==='viewing-table'&&h.sceneId==='photo'
 const action=(selection:FieldSelection,label:string)=>({id:'field:'+selection,label,type:selection==='read'?'campaign-observe' as const:'campaign-decide' as const,stage:'field' as const,selection})
 const choices:ReturnType<typeof action>[]=[]
 if(atSource){
  if(!f.observed)return [action('read',t('查找索引提到的便笺','Find the note from the cross-reference'))]
  if(!f.disposition)choices.push(action('take',t('带走便笺原件','Take the original note')),action('leave',t('记住内容，把便笺留在这里','Remember it and leave the note here')))
  else if(f.disposition==='take')choices.push(action('return',t('把便笺原件放回原处','Put the original note back')))
  else choices.push(action('borrow',f.copy?t('重新拿起便笺原件','Take the original note again'):t('借走便笺，去照相馆抄录','Borrow the note to copy at the studio')))
 }
 if(atTable&&f.observed&&!f.copy&&(f.disposition==='take'||f.content.target==='viewing-table'))choices.push(action('copy',t('在放大台抄录便笺副本','Make a written copy at the viewing table')))
 return choices
}
export function fieldHandling(h:Pick<OldStreetHead,'campaign'|'save'>){
 const f=h.campaign?.field;if(!f?.observed||h.save.facts.departed)return ''
 const zh=h.save.locale==='zh',place=fieldSites[f.content.target].label[zh?0:1]
 if(f.copy)return f.disposition==='take'?(zh?`副本已收好。原件还在你身上，可回${place}放回，也可以保留。`:`The copy is packed. You still have the original; return it to ${place}, or keep it.`):(zh?'副本已收好，原件留在原处。':'The copy is packed; the original remains in place.')
 if(f.disposition==='take')return zh?'原件在你身上。可到照相馆放大台抄录，再回原处归还。':'You have the original. Copy it at the studio viewing table, then return it to where you found it.'
 return zh?'可带走原件，也可以在照相馆放大台抄录副本后归还；留下原件则能向家人转述。':'Take the original, or make a written copy at the studio viewing table and return it. Leaving it also lets you tell your family what you learned.'
}
export function fieldKnowledge(h:Pick<OldStreetHead,'campaign'|'save'>){
 const f=h.campaign?.field;if(!f)return []
 const zh=h.save.locale==='zh',known=[{id:'field-lead',text:fieldLead(f,h.save.locale)}]
 if(f.observed)known.push({id:'field-finding',text:f.content.finding})
 if(f.copy)known.push({id:'field-copy',text:zh?'你在照相馆抄录的便笺副本已放进行囊，内容与读过的原件一致。':'Your written copy of the note is in your bag. It preserves the content you read in the original.'})
 if(f.observed&&!h.save.facts.departed)known.push({id:'field-handling',text:fieldHandling(h)})
 if(f.disposition)known.push({id:'field-disposition',text:f.disposition==='take'?(zh?'补充便笺原件在行囊里，原处已空。':'The supplementary note is in your bag; its former place is empty.'):(zh?'补充便笺留在原处，发现已记下。':'The supplementary note remains where you found it; you remember its contents.')})
 return known
}
