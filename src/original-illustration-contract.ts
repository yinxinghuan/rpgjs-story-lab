export type OriginalIllustration={id:string;scene:string;sourceVersion:number;referenceVersion:string;reference?:{url:string;sha256:string};state:'preparing'|'failed'|'candidate'|'active'|'discarded';attempt:number;recoverable:boolean;nextAt:number;error?:string;asset?:{sha256:string;bytes:number;width:768;height:1024};decision?:{verdict:'kept'|'discarded';sha256:string;at:number}}
export function readOriginalIllustrations(value:any):OriginalIllustration[]{
 const list=value?.illustrations
 if(!Array.isArray(list)||list.length>9)throw Error('ILLUSTRATION_INVALID_RESPONSE')
 const scenes=new Set<string>()
 for(const j of list){
  if(!j||typeof j.id!=='string'||!/^[a-f0-9-]{36}$/.test(j.id)||typeof j.scene!=='string'||!/^train-at-[a-z-]+$/.test(j.scene)||scenes.has(j.scene)||!Number.isSafeInteger(j.sourceVersion)||j.sourceVersion<0||typeof j.referenceVersion!=='string'||j.referenceVersion.length>150||!['preparing','failed','candidate','active','discarded'].includes(j.state)||![1,2].includes(j.attempt)||typeof j.recoverable!=='boolean'||!Number.isSafeInteger(j.nextAt)||j.nextAt<0||j.error!==undefined&&typeof j.error!=='string')throw Error('ILLUSTRATION_INVALID_RESPONSE')
  if(j.reference!==undefined){
   const r=j.reference
   if(!r||typeof r.url!=='string'||!/^https:\/\/[^\s]+$/.test(r.url)||typeof r.sha256!=='string'||!/^[a-f0-9]{64}$/.test(r.sha256))throw Error('ILLUSTRATION_INVALID_RESPONSE')
   const url=new URL(r.url)
   if(url.username||url.password||url.search||url.hash)throw Error('ILLUSTRATION_INVALID_RESPONSE')
  }
  scenes.add(j.scene)
  if(['candidate','active','discarded'].includes(j.state)&&(!j.asset||!/^[a-f0-9]{64}$/.test(j.asset.sha256)||!Number.isSafeInteger(j.asset.bytes)||j.asset.bytes<45||j.asset.bytes>8388608||j.asset.width!==768||j.asset.height!==1024))throw Error('ILLUSTRATION_INVALID_RESPONSE')
  if(['active','discarded'].includes(j.state)&&(!j.decision||j.decision.verdict!==(j.state==='active'?'kept':'discarded')||j.decision.sha256!==j.asset?.sha256||!Number.isSafeInteger(j.decision.at)||j.decision.at<0))throw Error('ILLUSTRATION_INVALID_RESPONSE')
 }
 return list
}
export function illustrationAction(job:OriginalIllustration|undefined,currentScene:string,selectedScene:string,now:number){
 if(job?.state==='active')return 'complete'
 if(job?.state==='candidate')return 'review'
 if(job&&job.nextAt>now)return 'wait'
 if(job?.recoverable)return 'recover'
 if(job&&job.attempt>=2)return 'exhausted'
 if(!job&&selectedScene!==currentScene)return 'return'
 return job?'retry':'create'
}
