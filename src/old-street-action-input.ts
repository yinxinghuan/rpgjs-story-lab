import type {Locale} from './vendor/original-train/types'
export const oldStreetActionNames: Record<string, [string, string]> = {
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
 'borrow-trolley':['借一下推车','借用推车','borrow the trolley'],
 'return-trolley':['把推车还回去','还推车','return the trolley'],
 'clear-crates':['搬开箱子','清开台阶','move the crates'],
 'borrow-key':['借钥匙','借一下钥匙','borrow the key'],
 'return-key':['还钥匙','归还小格钥匙','return the key'],
 'take-letter':['拿走信','取信','take the letter'],
 'greet-watchmaker':['你好','hello'], 'greet-laundry':['你好','hello'], 'greet-photographer':['你好','hello'],
}
/** Whole utterance matching only: negations, questions about ability, compound
 * intents and raw internal IDs do not become actions by substring matching. */
export function resolveOldStreetInput(text:string,locale:Locale,allowed:readonly string[]):string|undefined{
 if(!text.trim()||text.length>500)return undefined
 const wanted=normalize(text)
 const matches=allowed.filter(id=>{
  const key=id.replace('oldstreet:',''),pair=oldStreetActionNames[key]
  // Departure has a separate explicit confirmation; input cannot skip it.
  if(!pair||key==='leave')return false
  return [pair[locale==='zh'?0:1],...(aliases[key]??[])].some(label=>normalize(label)===wanted)
 })
 return matches.length===1?matches[0]:undefined
}
