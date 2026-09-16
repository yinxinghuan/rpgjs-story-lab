import type {StorySave} from './vendor/original-train/types'
/** One authoritative route explanation for greeting, topic and model knowledge. */
export function oldStreetLetterGuidance(save:Pick<StorySave,'locale'|'facts'>){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en,f=save.facts
 if(f['letter-taken'])return t('信已经在你手里了。你可以沿街口回家，也可以再逛逛。','You have the letter. You can head home or keep exploring.')
 if(f['letter-unlocked'])return t('小格已经打开了，信还在里面。直接回修表铺拿就好。','The compartment is already open and the letter is still inside. Go back to the watch shop to collect it.')
 if(f['key-borrowed'])return t('拿着钥匙回修表铺，打开那个小格就能找到信。','Take the key to the watch shop and open the compartment.')
 return t('信放在修表铺的小格里。钥匙可以借给你。','The letter is in the shop compartment. You may borrow the key.')
}

/** Current possession and the recorded promise are distinct from needing a key. */
export function oldStreetKeyStatus(save:Pick<StorySave,'locale'|'facts'|'inventory'|'relationships'>){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 if(save.inventory.some(i=>i.id==='letter-key'&&i.count>0))return t('玩家现在持有你借给他的小格钥匙。','The player currently carries the compartment key you lent them.')
 const returned=save.relationships.some(r=>r.characterId==='zhou-watchmaker'&&r.axis==='kept-promise'&&r.delta>0)
 const status=returned?t('玩家已经把借用的小格钥匙交还给你。','The player has returned the borrowed compartment key to you.'):t('玩家现在没有小格钥匙。','The player does not currently have the compartment key.')
 if(save.facts['letter-taken'])return status+t('信已经取走，取信不再需要钥匙。',' The letter has been collected; its collection no longer needs a key.')
 if(save.facts['letter-unlocked'])return status+t('小格已经打开，玩家可以直接回去取信。',' The compartment is open; the player can go back and collect the letter.')
 return status+t('小格仍锁着；要打开它可以向你借钥匙。',' The compartment is still locked; the player can borrow the key from you to open it.')
}
