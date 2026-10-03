import {oldStreetPerson} from './old-street-characters';
import type {StorySave} from './vendor/original-train/types';
import type {ExampleCandidate} from './ExampleAssist';
type Pair=readonly[string,string];
export function oldStreetExamples(save:StorySave,target:string|undefined,contextId:string,title:string){
 const locale=save.locale,f=save.facts,person=target&&oldStreetPerson(target),known=person&&save.characters.some(c=>c.id===person.id);
 let pairs:Pair[]=[['我接下来可以从哪里开始？','Where could I start next?'],['这里有什么值得留意的？','What should I pay attention to here?']];
 if(known){
  if(f.departed)pairs=[['回想这次来访，你有什么想说的？','Looking back on this visit, what would you like to say?'],['我们还能聊聊这里的日常吗？','Could we talk about everyday life here?']];
  else if(target==='watchmaker')pairs=f['clock-returned']?[['钟已经送还了，你有什么想说的吗？','The clock has been returned. Is there anything you would like to say?'],['你平时最喜欢修什么东西？','What do you most enjoy repairing?']]:[['你平时都修些什么？','What do you usually repair?'],['我在这里可以先了解些什么？','What could I learn about here?']];
  else if(target==='laundry-owner')pairs=f['clock-returned']?[['钟已经送回来了，你现在感觉怎么样？','The clock is back. How do you feel now?'],['你愿意聊聊店里的日常吗？','Would you tell me about everyday life in the shop?']]:f['crates-cleared']?[['台阶前的箱子已经搬开了，现在有什么要留意的？','The crates by the steps are cleared. What should I keep in mind now?'],['你平时怎样安排店里的工作？','How do you organize the work in the shop?']]:[['店里现在有什么需要帮忙的吗？','Is there anything you need help with here?'],['你可以介绍一下这里的日常吗？','Could you tell me about daily life here?']];
  else if(target==='photographer')pairs=f['photos-returned']?[['照片已经送回来了，你想怎样保存它们？','The photographs are back. How would you like to preserve them?'],['你在拍照时最留意什么？','What do you pay attention to when taking photographs?']]:[['你拍照时最留意什么？','What do you pay attention to when taking photographs?'],['这里有什么值得仔细看看？','What is worth a closer look here?']];
 }else if(person){pairs=[['你好，我想先认识一下你。','Hello, I would like to introduce myself.'],['请问这里是什么地方？','Could you tell me about this place?']];}
 else if(target){pairs=[[ '我想仔细看看'+title+'。','I would like to examine '+title+' closely.'],['我想找找眼前这个物件有没有可检查的细节。','I would like to look for details I can examine on this object.']];}
 const candidates:ExampleCandidate[]=pairs.map((p,i)=>({id:'old-street-'+i,text:p[locale==='zh'?0:1]}));
 return {key:JSON.stringify([contextId,save.location,locale,target,f,save.characters.map(c=>c.id),candidates]),candidates};
}
export function oldStreetRoomExamples(contextId:string,locale:'zh'|'en',archiveTitle?:string){
 // The UI itself introduces the darkroom; a lead title does not imply its contents.
 const pairs:Pair[]=archiveTitle?[['我想沿着已查阅的档案线索，在暗房寻找相关的旧照。','I would like to follow the archive lead I have read and look for related old photographs in the darkroom.'],['我想在暗房看看还有哪些照片可供仔细比较。','I would like to look for photographs I can compare closely in the darkroom.']]:[['我想看看照相馆后面的暗房里有什么。','I would like to explore what is in the darkroom behind the studio.'],['我想在暗房寻找可以仔细观察的旧照片。','I would like to find old photographs to examine in the darkroom.']];
 const candidates=pairs.map((p,i)=>({id:'old-street-room-'+i,text:p[locale==='zh'?0:1]}));
 return {key:JSON.stringify([contextId,locale,archiveTitle,candidates]),candidates};
}
