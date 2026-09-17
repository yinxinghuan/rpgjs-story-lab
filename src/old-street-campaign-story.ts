import {needsRecoveredNegative,negativeSourceReady} from './old-street-negative-source'
import type {OldStreetCampaign} from './old-street-campaign'
import type {StorySave} from './vendor/original-train/types'
/** Only called on new v2/v3 enrollment. Never rewrites an existing journey. */
export function introduceCampaignCommission(save:StorySave,version:2|3=2){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 save.facts['campaign-commission']='street-record'
 save.objective=t('取回密封信，查清随信寄存的旧街记录。','Collect the sealed letter and piece together the street records filed with it.')
 const opening=save.blocks.find(b=>b.id==='oldstreet-opening')
 if(version===3){
  save.facts['campaign-commission']='street-memory'
  save.objective=t('取回密封信，查清寄存的旧事，再寻找相关的旧照片。','Collect the sealed letter, reconstruct the filed street history, and find a related photograph.')
  if(opening)opening.text=t('修表铺门开着，柜台后没人。家人托你取回密封信，还想听懂随信寄存的旧事、看看那时的街景。先找小格里的信与寄存条。','The watch shop is open, its counter empty. Your family asked for their sealed letter, the story behind the papers filed with it, and a glimpse of the old street. Start with the letter and filing slip in the compartment.')
  return
 }
 if(opening)opening.text=t('修表铺门开着，柜台后没人。家人托你取回密封信，也想知道随信寄存的那份旧街记录，究竟记着怎样一件事。','The watch shop is open, but the counter is empty. Your family asked you to collect a sealed letter and find out what happened in the street records filed with it.')
}
export function campaignCommission(save:Pick<StorySave,'facts'|'locale'>){
 if(save.facts['campaign-commission']==='street-memory')return save.locale==='zh'?'家人托你取回密封信、查清随信寄存的旧事，再找一张相关旧照。原件可以带回，也可以留在当地，把发现讲给家人听；不用拆信。':'Your family asked for the sealed letter, an account of the filed street history, and a related photograph. Bring the originals home or leave them here and describe what you found. Do not open the letter.'
 if(save.facts['campaign-commission']!=='street-record')return undefined
 return save.locale==='zh'
  ?'家人请你取回密封信，并查清随信寄存的旧街记录。原件可以带回，也可以留在当地，把查明的经过转述给家人；不用拆信。'
  :'Your family asked for the sealed letter and a clear account of the street records filed with it. You may bring the papers home or leave the original here and tell them what happened. Do not open the letter.'
}
export function campaignOpening(save:StorySave,fallback:string){return save.blocks.find(b=>b.id==='oldstreet-opening')?.text??fallback}

/** One stage hint for journal and authority; existing journeys keep their objectives. */
export function campaignPhotoPurpose(save:Pick<StorySave,'facts'|'locale'>,campaign?:OldStreetCampaign){
 if(save.facts.departed===true||campaign?.version!==3||!campaign.archive?.order||!campaign.parcel?.disposition)return undefined
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en,f=save.facts
 if(needsRecoveredNegative(campaign)&&!negativeSourceReady(save,campaign))return t('档案指向屋顶北侧柜子的双缺口底片套。从照相馆楼梯上去，找到通路并取回底片。','The file points to a double-notched negative sleeve in the north roof cabinet. Take the studio stairs, find a way across and recover the film.')
 if(needsRecoveredNegative(campaign)&&!f['darkroom-ready'])return f['roof-negative-returned']===true?t('底片已交照相馆保存。在放大台准备冲印，再从后门进入暗房。','The negative is stored at the studio. Prepare a print at the viewing table, then enter the darkroom through the back door.'):t('底片已收好。带到照相馆放大台准备冲印；也可先交给摄影师保存。','You have the negative. Bring it to the studio viewing table for printing, or first give it to the photographer for safekeeping.')
 if(typeof f['darkroom-photo-matched']!=='string')return f['darkroom-ready']===true
  ?(campaign.photoMethod?t('从照相馆后门进入暗房，在显影台调焦与曝光，看清相关旧照。','Enter the darkroom through the studio’s back door. Adjust focus and exposure at the bench to reveal the related photograph.'):t('从照相馆后门进入暗房，在显影台拼合相关旧照。','Enter the darkroom through the studio’s back door and match the related photograph at the developing bench.'))
  :t('旧事已经查清。到照相馆寻找与记录有关的旧照片。','The history is reconstructed. Look for a related photograph at the photo studio.')
 if(!['keep','leave'].includes(String(f['darkroom-photo-choice'])))return t('看清照片后，决定把它带回家，还是留在暗房、转述发现。','Decide whether to bring the photograph home or leave it in the darkroom and describe what you saw.')
 return t('信、记录与照片里的发现都已备好。可以从街口回家，也可以继续探索。','The letter, history and photographic findings are ready. Go home from the street, or keep exploring.')
}
