import {useState} from 'react'
import drawer from '../doc/oldstreet-drawer-guided/states.png'
import './old-street-loading.css'
export default function OldStreetLoading({locale,stage='page',done=0,total=0,failed=false,onRetry}:{locale:'zh'|'en';stage?:string;done?:number;total?:number;failed?:boolean;onRetry?:()=>void}){
 const zh=locale==='zh',[imageFailed,setImageFailed]=useState(false)
 const detail=failed?(zh?'街区还没准备好，请重新连接。':'The neighbourhood is not ready yet. Please reconnect.'):stage==='page'?(zh?'正在打开街区…':'Opening the neighbourhood…'):stage==='journey'?(zh?'正在恢复你的旅程…':'Restoring your journey…'):stage==='art'?(zh?`正在下载人物与物件 ${done}/${total}`:`Downloading characters and objects ${done}/${total}`):stage==='textures'?(zh?'正在整理人物与物件…':'Preparing characters and objects…'):(zh?'正在准备地图…':'Preparing the map…')
 return <div className="os-loading" role="status"><small>{zh?'旧街探索 · 试玩':'OLD STREET · PREVIEW'}</small>
  {!imageFailed&&<svg className="os-loading__object" viewBox="90 170 310 350" aria-hidden="true"><image href={drawer} width="1536" height="768" onError={()=>setImageFailed(true)}/></svg>}
  <p>{detail}</p>{!failed&&stage==='art'&&total>0&&<progress aria-label={zh?'素材下载进度':'Art download progress'} value={done} max={total}/>}
  {failed&&onRetry&&<button onClick={onRetry}>{zh?'重新连接并恢复':'Reconnect and recover'}</button>}
  <small>{zh?'已有进度会保留':'Your saved progress is kept'}</small>
 </div>
}
