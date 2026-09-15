import type {Locale} from './vendor/original-train/types'
import {originalActionIntentIssues} from './original-action-intent'
export const oldStreetActionNames: Record<string, [string, string]> = {
 'observe-darkroom':['查看显影台','Examine developing bench'],
  'greet-watchmaker':['打个招呼','Say hello'], 'greet-laundry':['打个招呼','Say hello'], 'greet-photographer':['打个招呼','Say hello'],
  'move-box': ['移开空盒', 'Move box'], 'take-lens': ['拿放大镜', 'Take lens'], 'borrow-trolley': ['借推车', 'Borrow trolley'],
  'clear-crates': ['移开旧箱', 'Move crates'], 'return-trolley': ['归还推车', 'Return trolley'], 'borrow-key': ['问候并借钥匙', 'Ask for key'],
  'return-key': ['归还钥匙', 'Return key'], 'lift-latch': ['抬起插销', 'Lift bolt'], 'unlock-letter': ['打开小格', 'Unlock compartment'],
  'take-letter': ['拿信', 'Take letter'], 'take-clock': ['帮忙送钟', 'Take clock'], 'inspect-clock': ['检查钟底', 'Inspect clock'],
  'return-clock': ['交还旧钟', 'Return clock'], 'take-photos': ['拿照片夹', 'Take photo folder'], 'match-photos': ['比对照片', 'Compare photos'],
  'return-photos': ['交还照片', 'Return photos'], 'consent-clock': ['询问是否留下钟的故事', 'Ask to record clock history'],
  'consent-photo': ['询问可留下哪张照片', 'Ask which photo may be shared'], 'record-clock': ['收录旧钟', 'Record clock'],
  'record-photo': ['收录照片', 'Record photo'], 'withdraw-clock': ['撤下旧钟记录', 'Withdraw clock entry'],
  'withdraw-photo': ['撤下照片记录', 'Withdraw photo entry'], 'leave': ['带信回家', 'Take the letter home'],
}

const normalize=(text:string)=>text.normalize('NFKC').trim().toLocaleLowerCase().replace(/[。.!！?？]+$/u,'').replace(/\s+/g,'')
const aliases:Record<string,readonly string[]>={
 'move-box':['把空盒移开','挪开空盒','move the empty box','move the box aside'],
 'take-lens':['拿起放大镜','拿走放大镜','pick up the magnifying glass','take the magnifying glass'],
 'borrow-trolley':['借一下推车','借用推车','borrow the trolley'],
 'return-trolley':['把推车还回去','还推车','return the trolley'],
 'clear-crates':['搬开箱子','清开台阶','move the crates'],
 'borrow-key':['借钥匙','借一下钥匙','borrow the key'],
 'return-key':['还钥匙','归还小格钥匙','return the key'],
 'take-letter':['拿走信','取信','take the letter'],
 'unlock-letter':['用钥匙打开小格','打开锁着的小格','unlock the compartment','open the compartment with the key'],
 'lift-latch':['拉开插销','打开院门插销','unbolt the courtyard gate','lift the bolt'],
 'take-clock':['拿起旧钟','带上旧钟','pick up the old clock','take the old clock'],
 'inspect-clock':['查看钟底','检查钟底刻记','examine the underside of the clock','inspect the clock mark'],
 'return-clock':['把旧钟还给店主','归还旧钟','return the old clock','give back the clock'],
 'take-photos':['拿起照片夹','拿走照片夹','pick up the photo folder','take the photo folder'],
 'match-photos':['对照旧照片','比对这些照片','compare the photographs','match the photographs'],
 'return-photos':['把照片还给摄影师','归还照片夹','return the photographs','give back the photo folder'],
 'record-clock':['把钟的故事记入册子','记录旧钟的故事','record the clock history'],
 'record-photo':['收录选好的照片','把选好的照片记入册子','record the selected photograph'],
 'withdraw-clock':['撤下钟的故事','移除旧钟记录','remove the clock entry'],
 'withdraw-photo':['撤下照片','移除照片记录','remove the photo entry'],
 'greet-watchmaker':['你好','hello'], 'greet-laundry':['你好','hello'], 'greet-photographer':['你好','hello'],
}
/** Whole utterance matching only: negations, questions about ability, compound
 * intents and raw internal IDs do not become actions by substring matching. */
export function resolveOldStreetInput(text:string,locale:Locale,allowed:readonly string[]):string|undefined{
 if(!text.trim()||text.length>500)return undefined
 const labels=allowed.map(id=>oldStreetActionNames[id.replace('oldstreet:','')]?.[locale==='zh'?0:1]).filter((s):s is string=>!!s)
 if(originalActionIntentIssues(text,labels).length)return undefined
 const wanted=normalize(text)
 const matches=allowed.filter(id=>{
  const key=id.replace('oldstreet:',''),pair=oldStreetActionNames[key]
  // Departure has a separate explicit confirmation; input cannot skip it.
  if(!pair||key==='leave')return false
  return [pair[locale==='zh'?0:1],...(aliases[key]??[])].some(label=>normalize(label)===wanted)
 })
 return matches.length===1?matches[0]:undefined
}
