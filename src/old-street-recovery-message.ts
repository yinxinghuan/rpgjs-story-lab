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
