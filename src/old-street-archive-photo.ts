import type {OldStreetCampaign} from './old-street-campaign'

/** Only the reconstructed, player-known history can seed the next discovery. */
export type ArchivePhotoSource={archiveId:string;title:string;events:string[];account:string}
export function archivePhotoSource(campaign?:OldStreetCampaign):ArchivePhotoSource|undefined{
 const archive=campaign?.archive
 if(!archive?.order)return
 return {archiveId:archive.id,title:archive.content.title,events:archive.order.map(id=>archive.content.cards.find(card=>card.id===id)!.label),account:archive.content.discovery}
}
export function assertArchivePhotoSource(value:unknown):asserts value is ArchivePhotoSource{
 const s=value as ArchivePhotoSource
 const line=(v:unknown,max:number)=>typeof v==='string'&&!!v.trim()&&v.length<=max&&!/[<>]/.test(v)
 if(!s||Object.keys(s).sort().join(',')!=='account,archiveId,events,title'||!line(s.archiveId,80)||!line(s.title,60)||!line(s.account,300)||!Array.isArray(s.events)||s.events.length!==4||s.events.some(e=>!line(e,70)))throw Error('INVALID_ARCHIVE_PHOTO_SOURCE')
}
export function archivePhotoSuggestion(locale:'zh'|'en'){
 return locale==='zh'?'寻找与查明的旧街事件有关的照片':'Look for a photograph related to the street history I reconstructed'
}
