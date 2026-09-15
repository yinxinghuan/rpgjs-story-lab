import type {OldStreetExpansionRequest} from './old-street-expansion'

/** Model-authored text is separate from immutable geometry and executable actions. */
export type ExpansionContent={title:string;discovery:string;photograph:string}
export function readExpansionContent(value:unknown):ExpansionContent{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('EXPANSION_CONTENT_INVALID')
 const r=value as Record<string,unknown>,limits={title:40,discovery:220,photograph:600}
 if(Object.keys(r).sort().join(',')!==Object.keys(limits).sort().join(','))throw Error('EXPANSION_CONTENT_INVALID')
 for(const [key,limit]of Object.entries(limits))if(typeof r[key]!=='string'||!r[key].trim()||r[key].length>limit||/[<>]/.test(r[key]))throw Error('EXPANSION_CONTENT_INVALID')
 return Object.fromEntries(Object.keys(limits).map(key=>[key,(r[key] as string).trim()])) as ExpansionContent
}
export function compileExpansionPlan(intent:OldStreetExpansionRequest,raw:unknown,locale:'zh'|'en'='zh'){
 const content=readExpansionContent(raw)
 return {
  version:1 as const,requestId:intent.id,template:intent.template,content:{...content,
   arrival:locale==='zh'?'小灯照着旧工作台，门仍通向照相馆。':'A small lamp lights the old workbench. The door leads back to the photo studio.',
   observation:locale==='zh'?'工作台上的照片还看不清，可以先在房间里看看。':'The photograph on the workbench is not clear yet. You can look around the room first.'},
  // One checked layout for the first experiment; model output cannot move a doorway.
  space:{id:'darkroom',sourceScene:intent.sourceScene,floor:{x:88,y:112,w:208,h:320},
   entrance:{side:'S' as const,position:{x:192,y:432},arrival:{x:192,y:396}},
   bench:{id:'developing-bench',body:{x:136,y:160,w:112,h:48},approach:{x:192,y:244}}},
  baseline:{floor:'photoFloor',wall:'photoWall',bench:'viewing-table',lighting:'dim-warm'},
  actions:[{id:'observe-bench',requires:[] as string[]},{id:'match-print',requires:['photograph']}],
  media:[
   {id:'atmosphere',requiredForEntry:false,requiredForAction:false,description:'An empty worn photographic darkroom surface, orthographic overhead, subdued warm lighting. No doors, furniture, people or objects; these remain independent.'},
   {id:'photograph',requiredForEntry:false,requiredForAction:true,description:content.photograph},
  ],
 }
}
export type ExpansionPlan=ReturnType<typeof compileExpansionPlan>
/** Loaded texture arrival is independent of world coordinates and story facts. */
export function expansionPresentation(plan:ExpansionPlan,ready:readonly string[],safeToSwap:boolean){
 return {useBaseline:!ready.includes('atmosphere')||!safeToSwap,
  actions:plan.actions.filter(action=>action.requires.every(id=>ready.includes(id))).map(action=>action.id)}
}
