import type {StorySave} from './vendor/original-train/types'
/** One authoritative route explanation for greeting, topic and model knowledge. */
export function oldStreetLetterGuidance(save:Pick<StorySave,'locale'|'facts'>){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en,f=save.facts
 if(f['letter-taken'])return t('信已经在你手里了。你可以沿街口回家，也可以再逛逛。','You have the letter. You can head home or keep exploring.')
 if(f['letter-unlocked'])return t('小格已经打开了，信还在里面。直接回修表铺拿就好。','The compartment is already open and the letter is still inside. Go back to the watch shop to collect it.')
 if(f['key-borrowed'])return t('拿着钥匙回修表铺，打开那个小格就能找到信。','Take the key to the watch shop and open the compartment.')
 return t('信放在修表铺的小格里。钥匙可以借给你。','The letter is in the shop compartment. You may borrow the key.')
}
