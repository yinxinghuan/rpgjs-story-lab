export type OriginalIllustration={id:string;scene:string;sourceVersion:number;referenceVersion:string;state:'preparing'|'failed'|'active';attempt:number;recoverable:boolean;nextAt:number;error?:string;asset?:{sha256:string;bytes:number;width:768;height:1024}}
export function readOriginalIllustrations(value:any):OriginalIllustration[]{
 const list=value?.illustrations
 if(!Array.isArray(list)||list.length>9)throw Error('ILLUSTRATION_INVALID_RESPONSE')
 const scenes=new Set<string>()
 for(const j of list){
  if(!j||typeof j.id!=='string'||!/^[a-f0-9-]{36}$/.test(j.id)||typeof j.scene!=='string'||!/^train-at-[a-z-]+$/.test(j.scene)||scenes.has(j.scene)||!Number.isSafeInteger(j.sourceVersion)||j.sourceVersion<0||typeof j.referenceVersion!=='string'||j.referenceVersion.length>150||!['preparing','failed','active'].includes(j.state)||![1,2].includes(j.attempt)||typeof j.recoverable!=='boolean'||!Number.isSafeInteger(j.nextAt)||j.nextAt<0||j.error!==undefined&&typeof j.error!=='string')throw Error('ILLUSTRATION_INVALID_RESPONSE')
  scenes.add(j.scene)
  if(j.state==='active'&&(!j.asset||!/^[a-f0-9]{64}$/.test(j.asset.sha256)||!Number.isSafeInteger(j.asset.bytes)||j.asset.bytes<45||j.asset.bytes>8388608||j.asset.width!==768||j.asset.height!==1024))throw Error('ILLUSTRATION_INVALID_RESPONSE')
 }
 return list
}
export function illustrationAction(job:OriginalIllustration|undefined,currentScene:string,selectedScene:string,now:number){
 if(job?.state==='active')return 'complete'
 if(job&&job.nextAt>now)return 'wait'
 if(job?.recoverable)return 'recover'
 if(job&&job.attempt>=2)return 'exhausted'
 if(selectedScene!==currentScene)return 'return'
 return job?'retry':'create'
}
