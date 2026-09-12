import React from 'react'
import './journey-loading.css'
export default function JourneyLoading({locale,detail,compact=false}:{locale:'zh'|'en';detail:string;compact?:boolean}){
 return <div className={'og-wait'+(compact?' og-wait--compact':'')} role="status">
  {!compact&&<div className="og-wait__window" aria-hidden="true"><i/><i/><i/></div>}
  {!compact&&<small>{locale==='zh'?'驶向黎明':'LAST TRAIN TO DAWN'}</small>}
  <p>{detail}</p><span className="og-wait__line" aria-hidden="true"/>
  {!compact&&<small>{locale==='zh'?'旅途正在眼前展开':'Your journey is coming into view'}</small>}
 </div>
}
