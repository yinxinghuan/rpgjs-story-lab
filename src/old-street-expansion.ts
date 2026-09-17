import {assertArchivePhotoSource,type ArchivePhotoSource} from './old-street-archive-photo'
/** A player intention, not an admitted room or a completed story fact. */
export type OldStreetExpansionRequest={
 version:1;id:string;template:'photo-darkroom-v1';sourceScene:'photo';
 input:string;status:'requested';requestedAtVersion:number;archiveSource?:ArchivePhotoSource
}
export function assertOldStreetExpansions(value:unknown):asserts value is OldStreetExpansionRequest[]|undefined{
 if(value===undefined)return
 if(!Array.isArray(value)||value.length>1)throw Error('INVALID_EXPANSIONS')
 for(const r of value){
  if(r?.archiveSource!==undefined)assertArchivePhotoSource(r.archiveSource)
  if(!r||r.version!==1||typeof r.id!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(r.id)||r.template!=='photo-darkroom-v1'||r.sourceScene!=='photo'||r.status!=='requested'||typeof r.input!=='string'||!r.input.trim()||r.input.length>500||!Number.isSafeInteger(r.requestedAtVersion)||r.requestedAtVersion<0)throw Error('INVALID_EXPANSIONS')
 }
}
