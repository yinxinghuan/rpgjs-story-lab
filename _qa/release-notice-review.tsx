import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import {GameReleaseNotice,useGameRelease} from '../src/game-release-notice'
function Review(){const available=useGameRelease('a'.repeat(24),new URL('./_qa/',location.href).href),[busy,setBusy]=useState(true);const locale=new URLSearchParams(location.search).get('lang')==='en'?'en':'zh';return <main style={{color:'#eee4cc',padding:24,fontFamily:'system-ui'}}><h1>更新提示 · 本地合成检查</h1><p>{busy?'当前行动正在确认':'当前行动已结束'}</p><p>{available?'已检测到新版本，等候操作结束':'尚未检测到新版本'}</p><button onClick={()=>window.dispatchEvent(new Event('focus'))}>检查新版</button><button onClick={()=>setBusy(false)}>完成当前行动</button>{available&&!busy&&<GameReleaseNotice version={available} locale={locale}/>}</main>}
createRoot(document.getElementById('root')!).render(<Review/>);
