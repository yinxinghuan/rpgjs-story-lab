import {useEffect,useRef,useState} from 'react';
import './ExampleAssist.css';
export type ExampleCandidate={id:string;text:string};
type Props={candidates:ExampleCandidate[];value:string;onChange:(value:string)=>void;inputId:string;locale:'zh'|'en';disabled?:boolean};
// Presentation only: parent owns context key, draft persistence and manual submit.
export function ExampleAssist({candidates,value,onChange,inputId,locale,disabled=false}:Props){
 const [preview,setPreview]=useState<ExampleCandidate|null>(null),[used,setUsed]=useState(false),[notice,setNotice]=useState(false);
 const index=useRef(-1),owned=useRef<string|null>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(owned.current!==null&&value!==owned.current)owned.current=null},[value]);
 const t=(z:string,e:string)=>locale==='zh'?z:e;
 const focusInput=()=>{const input=document.getElementById(inputId) as HTMLInputElement|HTMLTextAreaElement|null;input?.focus()};
 const apply=(candidate:ExampleCandidate)=>{if(disabled)return;owned.current=candidate.text;onChange(candidate.text);setPreview(null);setNotice(true);focusInput()};
 const next=()=>{if(disabled||!candidates.length)return;index.current=(index.current+1)%candidates.length;setUsed(true);const candidate=candidates[index.current];if(!value.trim()||value===owned.current)apply(candidate);else{setPreview(candidate);setNotice(false)}};
 return <div className="rpg-example-assist">
  <button ref={trigger} type="button" disabled={disabled||!candidates.length} onClick={next} aria-controls={inputId} aria-expanded={!!preview}>{used?t('换个例子','Another example'):t('举个例子','Give an example')}</button>
  {preview?<section aria-label={t('可供改写的例子','An example you can edit')}>
   <p aria-live="polite">{preview.text}</p>
   <small>{t('你已经写了内容。只有点击替换，才会改动输入框。','You have a draft. It will only change if you choose to replace it.')}</small>
   <div className="rpg-example-assist__actions">
    <button type="button" disabled={disabled} onClick={()=>apply(preview)}>{t('用这个替换草稿','Replace draft with this')}</button>
    <button type="button" disabled={disabled} onClick={()=>{setPreview(null);trigger.current?.focus()}}>{t('保留我的草稿','Keep my draft')}</button>
   </div>
  </section>:<small role="status">{notice?t('例子已填入。可以改写，准备好再发送。','Example added. Edit it, then send when you are ready.'):t('不知道从哪说起？试试一个可改写的例子。','Not sure where to start? Try an example you can edit.')}</small>}
 </div>;
}
