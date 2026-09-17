import type {ArchiveProgress} from './old-street-archive'
import type {StorySave} from './vendor/original-train/types'
export type ArchiveReadingAction='read-lens'|'carry-sheet'|'spread-sheet'|'return-sheet'
export const archiveReadingItem='archive-reading-sheet'
export function archiveReadingChoices(archive:ArchiveProgress,save:Pick<StorySave,'facts'|'inventory'>,target:string,locale:'zh'|'en'){
 const source=archive.content.denseSource;if(!source)return []
 const t=(zh:string,en:string)=>locale==='zh'?zh:en,position=save.facts['archive-reading-position'],choices:Array<{selection:ArchiveReadingAction;label:string}>=[]
 if(target==='archive-'+source){
  if(position==='carried')choices.push({selection:'return-sheet',label:t('把夹页归还原处','Return the insert to its shelf')})
  else if(position!=='desk'){
   if(!archive.examined.includes(source)&&save.inventory.some(i=>i.id==='lens'&&i.count>0))choices.push({selection:'read-lens',label:t('用放大镜辨读','Read with the magnifying glass')})
   choices.push({selection:'carry-sheet',label:t('取下夹页，带到整理桌','Carry the insert to the table')})
  }
 }
 if(target==='archive-desk'){
  if(position==='carried')choices.push({selection:'spread-sheet',label:t('摊开夹页逐行核对','Spread out and examine the insert')})
  else if(position==='desk')choices.push({selection:'carry-sheet',label:t('拿起桌上的夹页','Pick up the insert from the table')})
 }
 return choices
}
export function archiveReadingStatus(archive:ArchiveProgress,save:Pick<StorySave,'facts'|'inventory'>,target:string,locale:'zh'|'en'){
 const source=archive.content.denseSource;if(!source)return ''
 const t=(zh:string,en:string)=>locale==='zh'?zh:en,position=save.facts['archive-reading-position']
 if(target==='archive-'+source)return position==='carried'?t('夹页在你的行囊里。可以带到整理桌摊开，或归还原处。','The insert is in your bag. Spread it on the table, or return it here.'):position==='desk'?t('夹页摊在整理桌上。已读线索仍保留在笔记里。','The insert is on the sorting table. Evidence you have read remains in your notes.'):!archive.examined.includes(source)?t('夹页字迹密集。可以用放大镜就地辨读，也可以取下带到桌上摊开核对。','The insert is covered in tiny handwriting. Use a magnifying glass here, or spread it out on the table to examine it.') : ''
 if(target==='archive-desk'&&position)return position==='carried'?t('你带着借阅夹页，摊到桌上即可逐行核对。','You have the borrowed insert. Spread it on the table to examine it.'):t('借阅夹页留在桌面。可以拿起后送回原资料架。','The borrowed insert is on the table. You can pick it up and return it to its shelf.')
 return ''
}
export function archivePaperPose(target:string,facts:Record<string,unknown>){
 const source=facts['archive-dense-source'],position=facts['archive-reading-position']
 if(target==='archive-'+source&&position)return 'without-paper'
 if(target==='archive-desk'&&position==='desk')return 'spread-paper'
 return 'stand'
}
