import type {OldStreetHead} from '../src/old-street-head'
import {archiveReadingChoices,archiveReadingItem} from '../src/old-street-archive-reading'
import {archiveEvidence} from '../src/old-street-archive'
import {LabError} from '../src/journey-runtime'
/** Called only after archive proximity validation, on a cloned head. */
export function applyArchiveReading(head:OldStreetHead,target:string,selection:unknown){
 const archive=head.campaign!.archive!,save=head.save,source=archive.content.denseSource
 if(!source||!archiveReadingChoices(archive,save,target,save.locale).some(a=>a.selection===selection))throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 if(selection==='carry-sheet'){
  save.facts['archive-reading-position']='carried'
  save.inventory.push({id:archiveReadingItem,label:t('借阅的档案夹页','Borrowed archive insert'),count:1,rarity:'common'})
  return t('你收好夹页。到整理桌前摊开核对，也可以把它归还原处。','You take the insert. Spread it on the table to examine it, or return it to its shelf.')
 }
 if(selection==='return-sheet'||selection==='spread-sheet'){
  save.inventory=save.inventory.filter(i=>i.id!==archiveReadingItem)
  if(selection==='return-sheet'){delete save.facts['archive-reading-position'];return t('夹页归还原处，已记下的证据仍然保留。','The insert is back on its shelf. Your evidence notes are unchanged.')}
  save.facts['archive-reading-position']='desk'
 }
 if(!archive.examined.includes(source))archive.examined.push(source)
 return t(selection==='read-lens'?'放大镜下，小字可以辨认了。':'你把夹页摊平，逐行核对出这条记录。',selection==='read-lens'?'The tiny handwriting is legible through the lens.':'You spread out the insert and compare its lines.')+'\n'+archiveEvidence(archive.content,source,save.locale).join('\n')
}
