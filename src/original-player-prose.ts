/** Exact authored-copy corrections for retained saves. Never modifies the archive,
 * and is not a general rewriting pass over player dialogue or model prose. */
export const originalProseCorrections:ReadonlyArray<readonly [string,string]>=[
 ['行囊与急需物品随各自携带者登记，没有遗失的人被悄悄补回。','行囊与急需物品逐一登记，交还各自的携带者。'],
 ['Bags and essentials stay registered with their carriers, and no missing person is silently restored.','Bags and essentials are checked and returned to their carriers.'],
 ['大家按名单再次应答；没有把旧有损失改写成完好无缺。','大家按名单再次应答，随后开始检查受损的车厢。'],
 ['everyone answers the roll again; earlier losses remain losses.','everyone answers the roll again before checking the damaged carriages.'],
 ['启动机修复后，列车按最初承诺的支线离开；这段选择没有被终点重写。','启动机修复后，列车沿着你们选定的支线离开了北岬。'],
 ['After the starter repair, the train followed its committed first branch; the ending does not rewrite that choice.','After the starter repair, the train left North Cape along the branch you chose.'],
 ['排烟付出的燃料换来了保留物资的空间；燃料不会被终点返还。','为隧道排烟耗去了燃料，也让车上的物资得以保全。'],
 ['Fuel spent on ventilation preserved the supplies; arrival does not refund it.','Ventilating the tunnel used fuel and kept the supplies aboard safe.'],
 ['列车实际越过洪水桥后进入枢纽，抵达与过桥是两个不同的事实。','列车驶过洪水桥，在黎明枢纽的月台旁停稳。'],
 ['The train entered the junction after actually crossing the flood bridge; approach and crossing remain distinct facts.','The train crossed the flood bridge and came to rest beside the junction platform.'],
]
export function originalPlayerProse(text:string){for(const [before,after] of originalProseCorrections)text=text.replaceAll(before,after);return text}
