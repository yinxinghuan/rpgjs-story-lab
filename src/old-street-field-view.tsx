import {useEffect,useState} from 'react'
import type {FieldProgress} from './old-street-field-inquiry'
import {fieldLead} from './old-street-field-inquiry'
/** Preparation stays in the existing archive view; it never blocks exploration. */
export function OldStreetFieldLead({field,locale,id,api,admit,busy}:{field?:FieldProgress;locale:'zh'|'en';id:string;api:(path:string,body?:unknown)=>Promise<any>;admit:()=>Promise<void>;busy:boolean}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 const [state,setState]=useState('loading'),[retry,setRetry]=useState(0),[sending,setSending]=useState(false)
 const path='/sessions/'+id+'/campaign-field'
 useEffect(()=>{if(field)return;let active=true,timer:ReturnType<typeof setTimeout>|undefined
 const poll=async()=>{try{const r=await api(path);if(!active)return;setState(r.job?.state??'idle');if(['queued','planning'].includes(r.job?.state))timer=setTimeout(poll,2000)}catch{if(active)setState('offline')}}
 void poll();return()=>{active=false;if(timer)clearTimeout(timer)}
 },[path,api,retry,!!field])
 const prepare=async()=>{setSending(true);try{await api(path,{retry:state==='failed'});setRetry(n=>n+1)}catch{setState('offline')}finally{setSending(false)}}
 return <section className="os-field-lead" aria-label={t('继续追查','Follow the cross-reference')}>
  <h3>{t('还有一张补充便笺','A supplementary note')}</h3>
  <p>{field?fieldLead(field,locale):t('整理后的记录里还夹着一条交叉索引。可以沿着它回街区寻找补充材料，也可以结束这次调查。','A cross-reference remains among the sorted records. Follow it back into the neighborhood to find a supplementary note, or finish your investigation here.')}</p>
  {field?.observed&&<p>{field.content.finding}</p>}
  {!field&&<><p role="status">{state==='loading'?t('正在查看索引…','Checking the index…'):state==='offline'?t('暂时连接不上。进度还在，可以稍后重连。','Connection interrupted. Your progress is safe; reconnect when ready.'):state==='ready'?t('索引已可查阅。','The cross-reference is ready.'):state==='failed'?t('索引暂时没能展开，可以重试。','The cross-reference could not be prepared. You can retry.'):['queued','planning'].includes(state)?t('正在展开索引。可以先收起，继续探索。','Preparing the cross-reference. Close this and explore while it is prepared.'):''}</p>
  <button disabled={busy||sending||state==='loading'||['queued','planning'].includes(state)} onClick={()=>state==='offline'?setRetry(n=>n+1):state==='ready'?void admit():void prepare()}>{state==='offline'?t('重新连接','Reconnect'):state==='failed'?t('重试展开索引','Retry the cross-reference'):state==='ready'?t('查阅索引位置','Read the location in the index'):t('展开交叉索引','Prepare the cross-reference')}</button></>}
 </section>
}
