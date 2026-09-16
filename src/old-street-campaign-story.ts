import type {StorySave} from './vendor/original-train/types'
/** Only called on new v2 enrollment. Never rewrites an existing journey. */
export function introduceCampaignCommission(save:StorySave){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 save.facts['campaign-commission']='street-record'
 save.objective=t('取回密封信，查清随信寄存的旧街记录。','Collect the sealed letter and piece together the street records filed with it.')
 const opening=save.blocks.find(b=>b.id==='oldstreet-opening')
 if(opening)opening.text=t('修表铺门开着，柜台后没人。家人托你取回密封信，也想知道随信寄存的那份旧街记录，究竟记着怎样一件事。','The watch shop is open, but the counter is empty. Your family asked you to collect a sealed letter and find out what happened in the street records filed with it.')
}
export function campaignCommission(save:Pick<StorySave,'facts'|'locale'>){
 if(save.facts['campaign-commission']!=='street-record')return undefined
 return save.locale==='zh'
  ?'家人请你取回密封信，并查清随信寄存的旧街记录。原件可以带回，也可以留在当地，把查明的经过转述给家人；不用拆信。'
  :'Your family asked for the sealed letter and a clear account of the street records filed with it. You may bring the papers home or leave the original here and tell them what happened. Do not open the letter.'
}
export function campaignOpening(save:StorySave,fallback:string){return save.blocks.find(b=>b.id==='oldstreet-opening')?.text??fallback}
