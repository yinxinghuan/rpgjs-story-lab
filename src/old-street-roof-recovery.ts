import type {DomainActionRule,DomainEffect,DomainRequirement,Locale,StorySave} from './vendor/original-train/types'

export const roofRecoveryInitial={'roof-recovery':true,'roof-photo-ready':false,'roof-index-read':false,'roof-bridge-laid':false,'roof-box-open':false,'roof-negative-taken':false,'roof-negative-returned':false}
/** A new journey fixes supply before any room is visited; old saves retain roof stock. */
export function roofRecoveryForJourney(id:string){
 let seed=2166136261
 for(const c of id)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0
 return {...roofRecoveryInitial,'roof-plank-source':seed%2?'shed':'roof','roof-plank-taken':false}
}
export const roofSpareBoard={x:104,y:360,w:40,h:60}
export function roofSpareVisible(save:Pick<StorySave,'facts'>){return save.facts['roof-recovery']===true&&save.facts['roof-plank-source']==='shed'&&!save.facts['roof-plank-taken']}
export function roofStockVisible(save:Pick<StorySave,'facts'>){return save.facts['roof-recovery']===true&&save.facts['roof-plank-source']!=='shed'&&!save.facts['roof-bridge-laid']}
/** Only the current room reveals supply; no future cabinet contents leak. */
export function roofRecoveryKnowledge(save:Pick<StorySave,'facts'|'locale'>,room:string){
 const f=save.facts,t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 if(f['roof-recovery']!==true)return []
 if(room==='shed'&&f['roof-plank-source']==='shed')return [{id:'visible:roof-supply',text:f['roof-plank-taken']?t('工作棚的备用长板已经领取，原处空了。','The spare roof plank has been collected; its place in the workshop is empty.'):t('工作棚墙边有屋顶修补用的备用长板，修表师可以让你领取。','A spare roof repair plank rests beside the workshop wall. The watchmaker can give it to you.')}]
 if(room!=='roof')return []
 return [{id:'visible:roof-crossing',text:f['roof-bridge-laid']?t('长板已经搭过屋顶破损处，北边的柜子可以走过去。','A long plank spans the damaged roof decking, allowing access to the north cabinet.'):f['roof-plank-source']==='shed'?t('破损处无法直接跨过。现场只有短板，旁边的修补牌指向河边工作棚的备用长板。','The damaged decking cannot be crossed directly. Only a short plank lies here. The repair notice points to spare long planks at the riverside workshop.'):t('破损处无法直接跨过。屋顶有一块短板和一块足以跨过破损处的长板。','The damaged decking cannot be crossed directly. A short plank and a long plank capable of spanning it lie on the roof.')}]
}
export const roofGap={x:48,y:216,w:288,h:44}
export const roofBridge={x:176,y:208,w:40,h:60}
export const roofRecoveryNames:Record<string,[string,string]>={
 'read-photo-index':['翻看照片背面的归档标记','Read the filing mark on the back'],
 'try-short-plank':['试试短木板','Try the short plank'],
 'take-roof-plank':['领取屋顶修补用的长板','Collect the spare roof plank'],
 'lay-carried-roof-plank':['搭上带来的长木板','Lay the plank you brought'],
 'lay-roof-plank':['搭上长木板','Lay the long plank'],
 'open-roof-box':['按归档标记找底片','Find the negative from the filing mark'],
 'take-roof-negative':['取出底片套','Take the negative sleeve'],
 'return-roof-negative':['把底片交回照相馆','Return the negative to the studio'],
}
export const roofRecoveryActionRooms:Record<string,'darkroom'|'roof'|'photo'|'shed'>={'take-roof-plank':'shed','lay-carried-roof-plank':'roof','read-photo-index':'darkroom','try-short-plank':'roof','lay-roof-plank':'roof','open-roof-box':'roof','take-roof-negative':'roof','return-roof-negative':'photo'}
export const roofRecoveryProps=[
 {id:'roof-planks',room:'roof' as const,position:{x:248,y:412},approach:{x:212,y:400},body:{x:232,y:364,w:84,h:60},actions:['oldstreet:try-short-plank','oldstreet:lay-roof-plank','oldstreet:lay-carried-roof-plank']},
 {id:'roof-cache',room:'roof' as const,position:{x:192,y:156},approach:{x:184,y:178},body:{x:168,y:132,w:48,h:32},actions:['oldstreet:open-roof-box','oldstreet:take-roof-negative']},
]
export function roofRecoveryObstacles(save:Pick<StorySave,'facts'>){
 if(save.facts['roof-recovery']!==true)return []
 if(!save.facts['roof-bridge-laid'])return [{...roofGap}]
 return [{...roofGap,w:roofBridge.x-roofGap.x},{...roofGap,x:roofBridge.x+roofBridge.w,w:roofGap.x+roofGap.w-roofBridge.x-roofBridge.w}]
}
export function roofRecoveryRules(locale:Locale):DomainActionRule[]{
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 const need=(id:string,value:boolean,zh:string,en:string):DomainRequirement=>({type:'fact',id,equals:value,reason:t(zh,en)})
 const flag=(id:string):DomainEffect=>({type:'fact',id,value:true})
 const once=(id:string)=>need(id,false,'这一步已经完成。','This step is already complete.')
 const rule=(name:string,requirements:DomainRequirement[],effects:DomainEffect[],zh:string,en:string):DomainActionRule=>({id:'oldstreet:'+name,intent:'oldstreet:'+name,match:['oldstreet:'+name],requirements:[need('departed',false,'旅程已结束。','The journey has ended.'),need('roof-recovery',true,'这里没有这项发现。','That discovery is not here.'),{type:'map',nodeId:roofRecoveryActionRooms[name],reason:t('先走到物件旁。','Approach the object first.')},...requirements],effects,successText:t(zh,en),successChoices:['','','']})
 return [
  rule('read-photo-index',[need('roof-photo-ready',true,'先把照片显影清楚。','Develop the photograph first.'),once('roof-index-read')],[flag('roof-index-read')],'你翻过照片，背面归档标记写着：“对应底片：屋顶北侧柜子，双缺口纸套。”照片可以留在这里，标记已经记住。','You turn over the print. Its filing mark reads: “Matching negative: north roof cabinet, double-notched sleeve.” You remember the mark even if you leave the print here.'),
  rule('try-short-plank',[once('roof-bridge-laid')],[],'短板够不到破损处的另一边，你把它收回。旁边的长板能同时搭住两侧。','The short plank cannot reach the other edge. You pull it back. The longer plank beside it can rest on both sides.'),
  rule('lay-roof-plank',[{type:'fact',id:'roof-plank-source',notEquals:'shed',reason:t('这里没有长板，去河边工作棚领取备用板。','There is no long plank here. Collect a spare at the riverside workshop.')},once('roof-bridge-laid')],[flag('roof-bridge-laid')],'你把长板搭在两侧完整的屋面上。现在能走到北边的柜子旁了。','You rest the long plank on intact decking at both ends. You can now walk to the cabinet on the north side.'),
  rule('take-roof-plank',[{type:'fact',id:'roof-plank-source',equals:'shed',reason:t('这次修补的长板在屋顶。','The plank for this repair is on the roof.')},once('roof-plank-taken'),once('roof-bridge-laid')],[flag('roof-plank-taken'),{type:'inventory',action:'add',itemId:'roof-plank',count:1,item:{id:'roof-plank',label:t('屋顶修补长板','Roof repair plank'),count:1,rarity:'common'}}],'修表师指向墙边：“这块是留给屋顶修补的，你拿去吧。”你拿起长板，准备带到破损处。','The watchmaker points to the wall. “That plank is set aside for the roof repair. You can take it.” You pick it up to carry to the damaged decking.'),
  rule('lay-carried-roof-plank',[{type:'fact',id:'roof-plank-source',equals:'shed',reason:t('直接使用屋顶的长板即可。','Use the long plank already on the roof.')},{type:'item',id:'roof-plank',minCount:1,reason:t('先到河边工作棚领取长板。','Collect the spare plank at the riverside workshop first.')},once('roof-bridge-laid')],[flag('roof-bridge-laid'),{type:'inventory',action:'remove',itemId:'roof-plank',count:1}],'你把带来的长板搭在两侧完整的屋面上，试稳后松开手。北边的柜子可以走过去了。','You rest the plank you brought on intact decking at both ends and check its footing. You can now walk to the north cabinet.'),
  rule('open-roof-box',[need('roof-index-read',true,'先找到能辨认底片的归档标记。照相馆的旧照可能留有线索。','You need a filing mark to identify the negative. The studio photograph may hold a clue.'),need('roof-bridge-laid',true,'破损处还没有通路。','There is no crossing over the damaged decking yet.'),once('roof-box-open')],[flag('roof-box-open')],'你打开柜门，按照片背面的标记找到双缺口纸套。里面保存着对应的旧街底片。','You open the cabinet and find the double-notched sleeve described on the print. It holds the matching street negative.'),
  rule('take-roof-negative',[need('roof-box-open',true,'先打开柜子辨认纸套。','Open the cabinet and identify the sleeve first.'),once('roof-negative-taken')],[flag('roof-negative-taken'),{type:'inventory',action:'add',itemId:'street-negative',count:1,item:{id:'street-negative',label:t('旧街底片套','Street negative sleeve'),count:1,rarity:'common'}}],'你收好底片套，柜里的这一格空了。可以带回家，也可以交回照相馆保存。','You pack the negative sleeve, leaving its compartment empty. You may bring it home or return it to the studio for safekeeping.'),
  rule('return-roof-negative',[{type:'item',id:'street-negative',minCount:1,reason:t('底片套不在行囊里。','You are not carrying the negative sleeve.')},once('roof-negative-returned')],[flag('roof-negative-returned'),{type:'inventory',action:'remove',itemId:'street-negative',count:1}],'摄影师接过底片，放在放大台的资料夹旁：“这样以后还能再洗一张。谢谢你把它找回来。”','The photographer places the negative beside the folder on the viewing table. “Now we can make another print someday. Thank you for finding it.”'),
 ]
}
export function assertRoofRecovery(save:StorySave){
 const f=save.facts,has=save.inventory.filter(i=>i.id==='street-negative')
 if(f['roof-recovery']!==true){if(Object.keys(roofRecoveryInitial).some(k=>k!=='roof-recovery'&&f[k]!==undefined)||has.length||f['roof-plank-source']!==undefined||f['roof-plank-taken']!==undefined||save.inventory.some(i=>i.id==='roof-plank'))throw Error('ROOF_RECOVERY_UNSUPPORTED');return}
 for(const k of Object.keys(roofRecoveryInitial))if(typeof f[k]!=='boolean')throw Error('ROOF_RECOVERY_INVALID')
 if(f['roof-photo-ready']!==!!f['darkroom-photo-matched']||f['roof-index-read']&&!f['roof-photo-ready']||f['roof-box-open']&&(!f['roof-index-read']||!f['roof-bridge-laid'])||f['roof-negative-taken']&&!f['roof-box-open']||f['roof-negative-returned']&&!f['roof-negative-taken'])throw Error('ROOF_RECOVERY_SEQUENCE_INVALID')
 const source=f['roof-plank-source'],taken=f['roof-plank-taken'],planks=save.inventory.filter(i=>i.id==='roof-plank')
 if(source===undefined){if(taken!==undefined||planks.length)throw Error('ROOF_SUPPLY_LEGACY_INVALID')}
 else {
  if(!['roof','shed'].includes(String(source))||typeof taken!=='boolean'||source==='roof'&&taken||source==='shed'&&f['roof-bridge-laid']&&!taken)throw Error('ROOF_SUPPLY_SEQUENCE_INVALID')
  const carrying=source==='shed'&&taken&&!f['roof-bridge-laid']
  if(planks.length!==(carrying?1:0)||planks.some(i=>i.count!==1))throw Error('ROOF_PLANK_POSSESSION_INVALID')
 }
 const carried=f['roof-negative-taken']&&!f['roof-negative-returned']
 if(has.length!==(carried?1:0)||has.some(i=>i.count!==1))throw Error('ROOF_NEGATIVE_POSSESSION_INVALID')
}
