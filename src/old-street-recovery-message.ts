/** Player guidance never echoes transport bodies, URLs or implementation codes. */
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
 if(code==='OLD_STREET_DIALOGUE_TIMEOUT')return text('这次没等到回应。可以再问一次，或先看看别处。','No reply came this time. Ask again, or explore somewhere else.')
 if(code==='OLD_STREET_DIALOGUE_REJECTED')return text('这次没能回答。可以换个问法，或选择一个话题。','That question could not be answered. Rephrase it, or choose a topic.')
 if(code==='OLD_STREET_DIALOGUE_NOT_READY'||code==='OLD_STREET_INTERPRETER_NOT_READY')return text('暂时无法回应这句话。可以先选择现有的话题或行动。','A reply is unavailable right now. Choose an available topic or action for now.')
 return text('这一步没有完成，可以换个做法再试。','That step was not completed. Try another approach.')
}
