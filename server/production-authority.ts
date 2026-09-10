import {startJournalImage,runJournalImage,publicImageJob,type ImageProducer,type ImageJobStore} from './journal-image'
import {initialStory,type Locale} from '../src/story'
import {MAP_VERSION,safePosition,currentScene} from '../src/contract'
import {LabError,prepareAction,validateAction,type Head,type Narrator} from '../src/journey-runtime'
import {upgradeHead} from './head-migration'
import {exportJourney} from './journey-backup'
import {assertReadableJourney} from '../src/journey-compatibility'
import {SessionAuthority,type AuthorityStorage} from './session-authority'
export type {AuthorityStorage} from './session-authority'
export class ProductionAuthority extends SessionAuthority<Head>{
 constructor(db:AuthorityStorage,narrator:Narrator,now:()=>number=Date.now){super(db,{
  initial:(locale:Locale,id:string)=>({id,version:0,save:initialStory(locale),position:safePosition(null),mapVersion:MAP_VERSION}),
  upgrade:value=>upgradeHead(value as Head),assertReadable:assertReadableJourney,scene:h=>currentScene(h.save),validateAction,
  position:(h,value)=>{const p=safePosition(value,currentScene(h.save)),v=value as any;if(!v||p.x!==v.x||p.y!==v.y)throw new LabError('INVALID_POSITION');return p},
  prepare:(head,body,reserve)=>prepareAction(head,body,async(input,save,target,live)=>{
   if(live&&!reserve()){const fallback=await narrator(input,save,target,false);return {...fallback,trace:{mode:'local',attempts:0,fallback:true,reason:'rate-limit'}}}
   return narrator(input,save,target,live)
  }),
  preserveConcurrent:(candidate,current)=>{candidate.journalImage=current.journalImage},
 },now)}
 private imageStore(owner:string,id:string):ImageJobStore{return {
 get:()=>this.get(owner,id),
 update:change=>this.db.transaction(()=>{const row=this.row(owner,id),head=upgradeHead(JSON.parse(row.data));change(head);this.write(owner,head,row.cursor)}),
 }}
 image(owner:string,id:string){return publicImageJob(this.get(owner,id).journalImage)}
 startImage(owner:string,id:string,retry=false){return publicImageJob(startJournalImage(this.imageStore(owner,id),retry,this.now()))}
 runImage(owner:string,id:string,producer:ImageProducer){return runJournalImage(this.imageStore(owner,id),producer,this.now)}
 backup(owner:string,id:string){return exportJourney(this.db,owner,id)}
}
