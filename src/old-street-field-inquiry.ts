import type {OldStreetHead} from './old-street-head'
export type FieldContent={title:string;target:'drawer'|'viewing-table';finding:string}
export type FieldProgress={id:string;content:FieldContent;observed:boolean;disposition?:'take'|'leave'}
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
export function fieldChoices(h:OldStreetHead,target:string){
 const f=h.campaign?.field,t=(zh:string,en:string)=>h.save.locale==='zh'?zh:en
 if(!f||target!==f.content.target||h.sceneId!==fieldSites[f.content.target].room||h.save.facts.departed||target==='drawer'&&!h.save.facts['drawer-open'])return []
 const action=(selection:'read'|'take'|'leave',label:string)=>({id:'field:'+selection,label,type:selection==='read'?'campaign-observe' as const:'campaign-decide' as const,stage:'field' as const,selection})
 return !f.observed?[action('read',t('查找索引提到的便笺','Find the note from the cross-reference'))]:f.disposition?[]:[action('take',t('带走便笺原件，给家人看','Take the note to show your family')),action('leave',t('记住内容，把便笺留在这里','Remember it and leave the note here'))]
}
export function fieldKnowledge(h:Pick<OldStreetHead,'campaign'|'save'>){
 const f=h.campaign?.field;if(!f)return []
 const zh=h.save.locale==='zh',known=[{id:'field-lead',text:fieldLead(f,h.save.locale)}]
 if(f.observed)known.push({id:'field-finding',text:f.content.finding})
 if(f.disposition)known.push({id:'field-disposition',text:f.disposition==='take'?(zh?'补充便笺原件在行囊里，原处已空。':'The supplementary note is in your bag; its former place is empty.'):(zh?'补充便笺留在原处，发现已记下。':'The supplementary note remains where you found it; you remember its contents.')})
 return known
}
