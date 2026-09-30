/** Confirmed admission refusals, never uncertain model or transport outcomes. */
export const oldStreetAiRefusals=['AI_COOLDOWN','AI_REQUEST_IN_PROGRESS','AI_DIALOGUE_DAILY_LIMIT','AI_ROOM_DAILY_LIMIT']
export function oldStreetAiNotice(code:string,locale:'zh'|'en'){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 if(code==='AI_COOLDOWN')return t('请求有些密集，请稍等一分钟再试。进度已保留，仍可探索和选择现有行动。','Requests are arriving quickly. Try again in a minute. Your progress is saved; you can still explore and use existing actions.')
 if(code==='AI_REQUEST_IN_PROGRESS')return t('上一条请求还在处理中，可以先检查进度，不必重复提交。','Your previous request is still processing. Check its progress instead of submitting it again.')
 if(code==='AI_DIALOGUE_DAILY_LIMIT'||code==='AI_ROOM_DAILY_LIMIT')return t('今天的 AI 使用已达到保护上限，将在 UTC 零点恢复。已有旅程、房间和行动仍可继续。','Today’s AI use has reached its safety limit and resets at midnight UTC. Existing journeys, rooms and actions remain available.')
 if(code==='SERVICE_BUSY'||code==='MODEL_BUSY'||code==='SESSION_BUSY')return t('现在有些繁忙，请稍后检查进度。原旅程不会丢失。','The service is busy. Check progress again shortly; your original journey is safe.')
 return undefined
}
