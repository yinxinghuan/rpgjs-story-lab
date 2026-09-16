/** No network by default. --live must only be used after approval of this
 * fixed synthetic batch; never load browser storage or a production database. */
import {writeFileSync,readFileSync,existsSync} from 'node:fs'
import {createOldStreetAttemptGenerator,oldStreetAttemptContext} from '../server/old-street-attempt'
import {chatModel} from '../server/model'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import type {OldStreetHead} from '../src/old-street-head'
const cases=[
 {id:'crouch',scene:'shop',target:'drawer',input:'我蹲下来看看抽屉。'},
 {id:'knock',scene:'shop',target:'drawer',input:'我轻敲抽屉，听听里面有什么。'},
 {id:'move-box',scene:'shop',target:'drawer',input:'我把挡住抽屉的空盒挪开。'},
 {id:'empty-drawer',scene:'shop',target:'drawer',input:'我再看看已经拿走放大镜的抽屉。'},
 {id:'dismantle',scene:'shop',target:'letter-compartment',input:'我把锁着的小格直接拆掉。'},
 {id:'darkroom',scene:'darkroom',target:'developing-bench',input:'我凑近看看这张照片还需要做什么。'},
]
const fixtures=cases.map(c=>{
 const save=createInitialSave(oldStreetCartridge('zh'))
 if(c.id==='empty-drawer'){save.facts['drawer-open']=true;save.facts['lens-taken']=true;save.inventory.push({id:'lens',label:'放大镜',count:1,rarity:'common'})}
 const head:OldStreetHead={id:'synthetic-'+c.id,version:0,mapVersion:'oldstreet-furniture-3',sceneId:c.scene,position:{x:192,y:244},save}
 const actions=c.target==='drawer'&&c.id!=='empty-drawer'?[{id:'oldstreet:move-box',label:'移开空盒'}]:c.id==='darkroom'?[{id:'oldstreet:observe-darkroom',label:'观察显影台'},{id:'oldstreet:match-darkroom-photo',label:'拼合照片'}]:[]
 return {...c,context:oldStreetAttemptContext(head,c.target,actions)}
})
const args=process.argv.slice(2),live=args.includes('--live')
const output=args.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/oldstreet-free-attempts.json'
const selected=args.find(a=>a.startsWith('--cases='))?.slice(8).split(',')
if(selected?.some(id=>!fixtures.some(f=>f.id===id)))throw Error('UNKNOWN_CASE')
if(selected&&args.some(a=>a.startsWith('--retry=')))throw Error('CASES_AND_RETRY_ARE_EXCLUSIVE')
const chosen=fixtures.filter(f=>!selected||selected.includes(f.id))
if(!live){
 if(existsSync(output))throw Error('OUTPUT_EXISTS')
 writeFileSync(output,JSON.stringify({mode:'prepared-no-network',endpoint:'https://chat.aiwaves.tech/aigram/api/game-chat',maxRequests:chosen.length*4,fixtures:chosen},null,2));console.log('Prepared synthetic inputs only: '+output)
}
else{
 const retry=args.find(a=>a.startsWith('--retry='))?.slice(8).split(',')
 if(!retry&&existsSync(output))throw Error('OUTPUT_EXISTS_USE_EXPLICIT_RETRY')
 const previous=retry?JSON.parse(readFileSync(output,'utf8')):{results:[]}
 const results:any[]=previous.results
 if(retry&&retry.some(id=>!fixtures.some(f=>f.id===id)))throw Error('UNKNOWN_CASE')
 for(const f of chosen.filter(f=>!retry||retry.includes(f.id))){
  const used=results.filter(r=>r.id===f.id).reduce((n,r)=>n+r.requests,0)
  if(used>=4)throw Error('APPROVED_CASE_REQUEST_LIMIT')
  let requests=0;const started=Date.now()
  const generator=createOldStreetAttemptGenerator(async(system,user,options)=>{if(used+requests>=4)throw Error('APPROVED_CASE_REQUEST_LIMIT');requests++;return chatModel(system,user,options)})
  try{const result=await generator(f.input,f.context);results.push({id:f.id,input:f.input,result,requests,elapsedMs:Date.now()-started})}
  catch(error){results.push({id:f.id,input:f.input,error:error instanceof Error?error.message:'FAILED',requests,elapsedMs:Date.now()-started})}
  // Persist after each case, so an observation interruption never requires
  // blindly rerunning the batch. Output contains synthetic data only.
  writeFileSync(output,JSON.stringify({mode:'live',results},null,2))
  console.log('Recorded '+f.id)
 }
 console.log('Review actual replies for relevance and grounded consequences: '+output)
}
