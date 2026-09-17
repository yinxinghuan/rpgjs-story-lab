import {useState} from 'react'
/** Presentation groups only: every choice keeps its existing authority callback. */
export function OldStreetConversationChoices({locale,topics,sharing,disabled,onTalk,onShare}:{locale:'zh'|'en';topics:{id:string;text:string}[];sharing:{id:string;label:string}[];disabled:boolean;onTalk:(text:string)=>void;onShare:(text:string)=>void}){
 const t=(z:string,e:string)=>locale==='zh'?z:e
 const [more,setMore]=useState(false),[share,setShare]=useState(false)
 const choose=(fn:(text:string)=>void,text:string)=>{setMore(false);setShare(false);fn(text)}
 return <div className="os-conversation-choices">
  {topics.length>0&&<div className="os-choices">{topics.slice(0,2).map(topic=><button key={topic.id} disabled={disabled} onClick={()=>choose(onTalk,topic.text)}>{topic.text}</button>)}</div>}
  {topics.length>2&&<><button className="os-choice-disclosure" aria-expanded={more} disabled={disabled} onClick={()=>setMore(v=>!v)}>{t('其他话题','Other topics')}<svg data-open={more} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>{more&&<div className="os-choices">{topics.slice(2).map(topic=><button key={topic.id} disabled={disabled} onClick={()=>choose(onTalk,topic.text)}>{topic.text}</button>)}</div>}</>}
  {sharing.length>0&&<><button className="os-choice-disclosure" aria-expanded={share} disabled={disabled} onClick={()=>setShare(v=>!v)}>{t('分享发现','Share a discovery')}<svg data-open={share} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>{share&&<div className="os-choices">{sharing.map(choice=><button key={choice.id} disabled={disabled} onClick={()=>choose(onShare,choice.label)}>{choice.label}</button>)}</div>}</>}
 </div>
}
