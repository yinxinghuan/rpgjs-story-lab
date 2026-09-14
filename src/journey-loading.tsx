import React,{useState} from 'react'
import {selectLoadingObject} from './journey-loading-art'
import './journey-loading.css'
export default function JourneyLoading({locale,detail,compact=false,sceneId}:{locale:'zh'|'en';detail:string;compact?:boolean;sceneId?:string}){
 const [object]=useState(()=>selectLoadingObject(sceneId)),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false)
 const [x,y,w,h]=object.crop,[sw,sh]=object.sheet
 return <div className={'og-wait'+(compact?' og-wait--compact':'')} role="status">
  {!compact&&<small>{locale==='zh'?'驶向黎明':'LAST TRAIN TO DAWN'}</small>}
  {!compact&&<div className="og-wait__art" aria-hidden="true">
   {!failed&&<div className={'og-wait__object'+(loaded?' is-loaded':'')} style={{width:Math.min(260,190*w/h),aspectRatio:`${w}/${h}`}}>
    <img src={object.path} alt="" draggable={false} onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} style={{width:`${sw/w*100}%`,height:`${sh/h*100}%`,left:`${-x/w*100}%`,top:`${-y/h*100}%`}}/>
   </div>}
  </div>}
  {!compact&&<span className="og-wait__caption" style={{visibility:loaded&&!failed?'visible':'hidden'}}>{object.label[locale]}</span>}
  <p>{detail}</p><span className="og-wait__line" aria-hidden="true"/>
  {!compact&&<small>{locale==='zh'?'旅途正在眼前展开':'Your journey is coming into view'}</small>}
 </div>
}
