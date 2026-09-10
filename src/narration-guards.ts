// Narrow guards for failures actually observed in this stationary NPC study.
// They supplement semantic review; they are not a general natural-language proof.
export function stationaryAdviceIssues(text:string):string[]{
 const clauses=text.split(/[。！？!?;；\n]|(?:但是|不过|但)|\bbut\b/i)
 const offers=clauses.some(clause=>{
  const zh=/(?:我|周雨).{0,8}(?:帮你|帮忙|替你|来|会|可以|能|愿意).{0,10}(?:检查|打开|拿起|取出|收取|安装|装入|走进|过去|带路)/.test(clause)&&!/(?:不|没|无法|不能|不会|不可以)/.test(clause)
  const en=/\b(?:I|Zhou Yu)\s+(?:(?:will|can|could|would|shall|am going to)\s+(?:help you\s+)?|offer to\s+)(?:check|open|collect|take|install|enter|walk|go)\b|\b(?:I'll|I’ll|let me|may I|can I|could I)\s+(?:check|open|collect|take|install|enter|walk|go)\b/i.test(clause)&&!/\b(?:not|cannot|can't|can’t|won't|won’t|unable)\b/i.test(clause)
  return zh||en
 })
 return offers?['NPC_CAPABILITY_MISMATCH']:[]
}


// Actual live failure: reassurance promised portable lighting that this world
// cannot provide. This narrow check supplements, not replaces, semantic review.
export function unsupportedLightingAdviceIssues(text:string):string[]{
 const clauses=text.split(/[。！？!?;；\n]|(?:但是|不过|但)|\bbut\b/i)
 return clauses.some(clause=>/(?:备用.{0,6}(?:照明|灯光|灯具|设备)|手电(?:筒)?|蜡烛|\b(?:spare|backup)\s+(?:lighting|lights?|equipment)|\b(?:torch|flashlight|candles?)\b)/i.test(clause)&&!/(?:没有|不会|不能|找不到|不存在|并无|不提供)|\b(?:no|not|cannot|can't|can’t|won't|won’t|unavailable)\b/i.test(clause))?['UNSUPPORTED_LIGHTING_EQUIPMENT']:[]
}
