/** Player guidance never echoes transport bodies, URLs or implementation codes. */
export function oldStreetRecoveryCode(error:string){
 const known=['CLOUD_HEALTH_TIMEOUT','CLOUD_READ_TIMEOUT','CLOUD_WRITE_TIMEOUT','AUTH_REQUIRED','AUTHORITY_UNAVAILABLE','SERVICE_UNAVAILABLE','NOT_FOUND','SESSION_NOT_FOUND','SESSION_RESPONSE_MISMATCH','SESSION_RESPONSE_REGRESSED','INVALID_CLOUD_IDENTITY','OLD_STREET_SAVE_UNSUPPORTED','RUNTIME_VERSION_MISMATCH','STARTUP_TIMEOUT','ART_IMAGE_TIMEOUT','ART_IMAGE_DECODE_FAILED','SESSION_SELECTION_CHANGED','VERSION_CONFLICT','INVALID_PENDING','NETWORK_ERROR','UNAUTHORIZED','FORBIDDEN']
 const token=error.replace(/^Error:\s*/,'').trim()
 if(known.includes(token))return token
 if(/^(TimeoutError|AbortError)(:|$)/.test(token))return 'REQUEST_TIMEOUT'
 if(/^(TypeError: (Failed to fetch|Load failed|NetworkError)|NetworkError:)/.test(token))return 'NETWORK_UNAVAILABLE'
 // Never echo unknown server bodies, exception messages, URLs or credentials.
 return 'RECOVERY_UNCLASSIFIED'
}
export function oldStreetRecoveryMessage(error:string,locale:'zh'|'en'){
 const text=(zh:string,en:string)=>locale==='zh'?zh:en
 if(/SAVE_UNSUPPORTED|SAVE_INVALID|INVALID_PENDING|INVALID_CLOUD_IDENTITY/.test(error))return text('这段旅程暂时无法读取。请保留当前数据，稍后重新连接。','This journey cannot be read right now. Keep the current data and try reconnecting later.')
 if(/RUNTIME_VERSION_MISMATCH/.test(error))return text('街区刚刚更新了，请重新连接后继续旅程。','The neighbourhood has been updated. Reconnect to continue your journey.')
 if(/ART_DOWNLOAD_|IMAGE|TEXTURE/.test(error))return text('部分场景素材没有加载完成，请重新连接后继续。','Some scene artwork could not finish loading. Reconnect to continue.')
 if(/MAP_|STARTUP_|BOOT_/.test(error))return text('地图还没准备好。请重新连接，回到这段旅程。','The map is not ready yet. Reconnect to return to this journey.')
 if(/SESSION_SELECTION_CHANGED|VERSION_CONFLICT|STALE_POSITION/.test(error))return text('这段旅程的进度有变化，请重新连接以继续最新进度。','This journey has changed. Reconnect to continue from its latest progress.')
 return text('暂时没能确认这一步的结果。请重新连接，我们会核对进度后继续。','This step could not be confirmed. Reconnect so we can check your progress and continue.')
}

/** A confirmed refusal has no pending outcome; the player can continue in place. */
export function oldStreetActionFailureMessage(code:string,locale:'zh'|'en'){
 const text=(zh:string,en:string)=>locale==='zh'?zh:en
 if(code==='NARRATION_RATE_LIMIT')return text('先歇一会儿再聊吧。现在仍可走动或选择行动。','Try chatting again shortly. You can still walk around or choose an action.')
 if(code==='CAMPAIGN_READING_AID_REQUIRED')return text('字迹密集。可以用放大镜，或把夹页带到整理桌摊开。','Use a magnifying glass, or carry the insert to the sorting table.')
 if(code==='CAMPAIGN_RACK_SPACE_REQUIRED')return text('先退到储物架前方，再把它移开。','Step in front of the rack before sliding it.')
 if(code==='CAMPAIGN_ARCHIVE_ORDER_MISMATCH')return text('这个顺序与记录不一致。对照已查到的线索，再调整一下。','That order contradicts the records. Compare the evidence and rearrange the cards.')
 if(code==='CAMPAIGN_ARCHIVE_EVIDENCE_REQUIRED')return text('两处资料架的线索还没有查齐，可以先过去看看。','You still need evidence from both shelves. Examine them first.')
 if(code==='CAMPAIGN_PAPERS_REQUIRED')return text('先阅读地下室里找到的材料。','Read the papers on the cellar shelf first.')
 if(code==='CAMPAIGN_ALREADY_RESOLVED')return text('这组记录已经核对好了。','These records have already been reconstructed.')
 if(code==='CAMPAIGN_RECORD_MISMATCH')return text('这条记录没有同时对上两处特征，再比较一下寄存条。','This record does not match both details. Compare it with the filing slip again.')
 if(code==='CAMPAIGN_OBSERVATION_REQUIRED')return text('先看看眼前的材料，再作决定。','Examine the papers before deciding.')
 if(code==='CAMPAIGN_UNFINISHED')return text('寄存材料的线索还没有查完，可以看看当前发现。','The trail to the archived papers is unfinished. Check your discoveries.')
 if(code==='CAMPAIGN_PLAN_REJECTED'||code==='CAMPAIGN_GENERATOR_UNAVAILABLE')return text('这份材料暂时没能展开。进度已保留，可以稍后再试。','These papers could not be prepared yet. Your progress is safe; try again later.')
 if(code==='OLD_STREET_MODEL_UNAVAILABLE')return text('暂时没能回应。可以稍后再试，或选择现有的话题和行动。','A response is unavailable right now. Try later, or choose an available topic or action.')
 if(code==='OLD_STREET_DIALOGUE_TIMEOUT')return text('这次没等到回应。可以再问一次，或先看看别处。','No reply came this time. Ask again, or explore somewhere else.')
 if(code==='OLD_STREET_DIALOGUE_REJECTED')return text('这次没能回答。可以换个问法，或选择一个话题。','That question could not be answered. Rephrase it, or choose a topic.')
 if(code==='OLD_STREET_DIALOGUE_NOT_READY'||code==='OLD_STREET_INTERPRETER_NOT_READY')return text('暂时无法回应这句话。可以先选择现有的话题或行动。','A reply is unavailable right now. Choose an available topic or action for now.')
 return text('这一步没有完成，可以换个做法再试。','That step was not completed. Try another approach.')
}
