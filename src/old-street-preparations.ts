import type {OldStreetHead} from './old-street-head'
export type PreparationTarget={id:string;path:string;place:string;title:string;returnTo:string}
export type Preparation=PreparationTarget&{state:'waiting'|'ready'|'failed'|'offline'}
/** Only discover jobs that are relevant to this journey; GET never creates one. */
export function preparationTargets(head:OldStreetHead,capabilities:{planning:boolean;media:boolean;campaign:boolean}):PreparationTarget[]{
 const {save,campaign,expansions}=head,t=(z:string,e:string)=>save.locale==='zh'?z:e,out:PreparationTarget[]=[]
 if(save.facts.departed)return out
 const add=(id:string,path:string,place:string,title:string,returnTo:string)=>out.push({id,path:'/sessions/'+head.id+'/'+path,place,title,returnTo})
 if(capabilities.campaign&&campaign&&save.facts['letter-taken']){
  if(!campaign.trace)add('trace','campaign-trace',t('修表铺','Watch shop'),t('寄存记录','Filing records'),t('回到记录册前阅读。','Return to the record book to read them.'))
  else if(campaign.trace.selected!==undefined&&!campaign.parcel)add('parcel','campaign-parcel',t('地下室','Cellar'),t('寄存材料','Filed papers'),t('回到资料架前阅读。','Return to the paper shelf to read them.'))
  else if(campaign.version>=2&&campaign.parcel?.observed&&!campaign.archive)add('archive','campaign-archive',t('地下室','Cellar'),t('档案间','Archive workroom'),t('回到资料架前继续追查。','Return to the paper shelf to follow the records.'))
  if(campaign.archive?.order&&!campaign.field)add('field','campaign-field',t('档案间','Archive workroom'),t('补充线索','Follow-up lead'),t('回到整理桌查看线索。','Return to the sorting table to check the lead.'))
 }
 if(expansions?.length&&capabilities.planning&&!save.facts['darkroom-ready'])add('area','expansion',t('照相馆','Photo studio'),t('暗房','Darkroom'),t('回到放大台，确认后从后门进入。','Return to the viewing table, then enter through the back door.'))
 if(expansions?.length&&capabilities.media&&save.facts['darkroom-ready']&&!save.facts['darkroom-photo-matched'])add('photo','expansion-photo',t('暗房','Darkroom'),t('旧街照片','Street photograph'),t('回到显影台查看照片。','Return to the developing bench to examine it.'))
 return out
}
export async function readPreparation(api:(path:string)=>Promise<any>,target:PreparationTarget):Promise<Preparation|null>{
 try{const {job}=await api(target.path);if(!job)return null
  const state=job.state==='ready'||job.state==='candidate'?'ready':job.state==='failed'?'failed':'waiting'
  return {...target,state}
 }catch{return {...target,state:'offline'}}
}
export function preparationBecameReady(before:Preparation|undefined,after:Preparation){return before?.state==='waiting'&&after.state==='ready'}
/** Keep the last known state across connection errors, but never across journeys. */
export class PreparationHistory{
 private session=''
 private rows=new Map<string,Preparation>()
 update(session:string,rows:Preparation[]){
  if(this.session!==session){this.session=session;this.rows.clear()}
  const ready=rows.filter(row=>preparationBecameReady(this.rows.get(row.id),row))
  this.rows=new Map(rows.map(row=>[row.id,row.state==='offline'?(this.rows.get(row.id)??row):row]))
  return ready
 }
}
