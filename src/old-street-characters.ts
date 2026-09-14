import type {CharacterDefinition,Locale,StorySave,StoryBlock} from './vendor/original-train/types'
const cast = [
 {id:'zhou-watchmaker',entity:'watchmaker',room:'shed',name:['老周','Zhou'],role:['修表师','Watchmaker'],intro:['擦钟的老人抬起头：“叫我老周就好，我在这儿修表。你是来取信的吧？”','The old man polishing a clock looks up. “Call me Zhou. I repair watches here. You must be here for the letter?”']},
 {id:'lan-laundry',entity:'laundry-owner',room:'laundry',name:['阿岚','Lan'],role:['洗衣店主','Laundry owner'],intro:['卷着袖子的女人放下衣篮：“我是阿岚，这家洗衣店的店主。有事就叫我。”','A woman with rolled sleeves sets down a laundry basket. “I’m Lan, the owner. Let me know if you need anything.”']},
 {id:'xu-photographer',entity:'photographer',room:'photo',name:['许青','Xu Qing'],role:['摄影师','Photographer'],intro:['戴眼镜的女人抬起相纸：“我叫许青，在这里洗照片。你可以先看看。”','A woman in glasses lifts a photographic print. “I’m Xu Qing. I develop photos here. Feel free to look around.”']},
] as const
const choose=(pair:readonly [string,string],locale:Locale)=>pair[locale==='zh'?0:1]
export function oldStreetCharacterDefinitions(locale:Locale):CharacterDefinition[]{return cast.map(p=>({id:p.id,name:choose(p.name,locale),role:choose(p.role,locale),vitality:100,stress:0,skills:[],hiddenUntilIntroduced:true}))}
export const oldStreetCharacterBindings = cast.map(p=>({id:p.id,kind:'physical' as const,entities:[p.entity]}))
export function oldStreetPerson(entity:string){return cast.find(p=>p.entity===entity)}
/** Authored visible introduction and its persisted roster entry share one Session commit.
 * This function is never run for movement or inferred from future script names. */
export function recordOldStreetInteraction(save:StorySave,entity:string,action:string,text:string,receipt:string):StoryBlock[]{
 const p=oldStreetPerson(entity),blocks:StoryBlock[]=[]
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 if(action==='oldstreet:greet-laundry')text=(save.facts['trolley-borrowed']?t('推车用完放回来就行。','Return the trolley when you finish.'):t('推车就在旁边，需要可以借。','The trolley is beside you; you may borrow it.'))+' '+(save.facts['crates-cleared']?t('院里的台阶已经通了，谢谢你。','The courtyard steps are clear now. Thank you.'):t('院里的旧箱挡着台阶。','Crates block the courtyard steps.'))
 if(action==='oldstreet:greet-watchmaker')text=save.facts['letter-taken']?(save.facts['yard-unlatched']?t('信收好了吧？沿院门回街口就能回家。','Got the letter safely? The courtyard gate leads back toward home.'):t('信收好了吧？把这边的插销抬起来，就能走院门近路。','Got the letter safely? Lift the bolt on this side to open the courtyard shortcut.')):save.facts['key-borrowed']?t('钥匙已经给你了，信在铺里的小格。','You have the key. The letter is in the shop compartment.'):text
 if(action==='oldstreet:greet-photographer'&&save.facts['photos-returned'])text=t('你找回的照片已经收好了，谢谢。楼梯仍然通向屋顶。','The photographs you found are safely put away. Thank you. The stairs still lead to the roof.')
 if(p&&!save.characters.some(c=>c.id===p.id)){
  const definition=oldStreetCharacterDefinitions(save.locale).find(c=>c.id===p.id)!
  blocks.push({id:receipt+':introduction',kind:'narration',text:choose(p.intro,save.locale),data:{characterId:p.id}})
  save.characters.push({...definition,status:'known',origin:'cartridge',lastKnownLocation:save.location,updatedAtScene:save.scene})
 }
 blocks.push({id:receipt+':result',kind:p?'dialogue':'narration',...(p?{speaker:choose(p.name,save.locale)}:{}),text})
 const relationship = ({'oldstreet:return-key':['zhou-watchmaker','kept-promise'],'oldstreet:return-clock':['lan-laundry','returned-family-clock'],'oldstreet:return-photos':['xu-photographer','returned-photographs']} as Record<string,[string,string]>)[action]
 if(relationship){
  const [characterId,axis]=relationship,person=save.characters.find(c=>c.id===characterId)
  if(person&&!save.relationships.some(r=>r.characterId===characterId&&r.axis===axis))save.relationships.push({id:receipt+':relationship',actor:person.name,characterId,axis,delta:1,source:action})
 }
 save.blocks.push(...blocks)
 return blocks
}
