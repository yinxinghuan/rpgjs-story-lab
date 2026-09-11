import React from 'react'
import {brakeArt} from './original-brake-art'
export function BrakeDetail({image,state,locale}:{image:string;state:'cracked'|'replaced';locale:'zh'|'en'}){
 const t=(a:string,b:string)=>locale==='zh'?a:b
 const part=(column:number,hose:boolean)=>{const scale=.56*(hose?brakeArt.hoseScale:1),left=96+(hose?brakeArt.attachment.x*.56:0)-152*scale,top=154+(hose?brakeArt.attachment.y*.56:0)-544*scale;return <span key={column} style={{position:'absolute',overflow:'hidden',left,top,width:304*scale,height:640*scale}}><img src={image} alt="" draggable={false} style={{position:'absolute',maxWidth:'none',width:912*scale,height:640*scale,left:-column*304*scale,top:0,pointerEvents:'none',imageRendering:'pixelated'}}/></span>}
 return <figure className="og-brake-detail" data-state={state} style={{margin:'8px auto 16px',width:192,maxWidth:'100%'}}><div role="img" aria-label={state==='replaced'?t('已安装完整制动软管','Sound brake hose installed'):t('带表面裂纹的制动软管','Brake hose with surface cracks')} style={{position:'relative',width:192,height:164,overflow:'hidden',background:'#233039',borderRadius:4}}>{part(0,false)}{part(state==='replaced'?2:1,true)}</div><figcaption>{state==='replaced'?t('新软管已安装，备用件已消耗。','The new hose is installed; the spare has been consumed.'):t('检修点的软管外皮有裂纹。','The hose at this service point has surface cracks.')}</figcaption></figure>
}
