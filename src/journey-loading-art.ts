export const loadingObjects=[
 {id:'starter',path:'./art/starter-states-v1.png',sheet:[640,640],crop:[0,200,310,385],label:{zh:'启动柜',en:'Starter cabinet'}},
 {id:'diesel',path:'./art/diesel-reserve-candidate-v1.png',sheet:[640,640],crop:[30,92,285,470],label:{zh:'沿线储油罐',en:'Trackside fuel reserve'}},
 {id:'pump',path:'./art/yard-pump-candidate-v1.png',sheet:[1536,640],crop:[30,164,475,342],label:{zh:'货场油泵',en:'Freight-yard pump'}},
] as const
let previous=''
export function selectLoadingObject(scene?:string){
 const preferred=scene==='train-at-graystone-yard'?'pump':scene==='train-at-dead-station'?'starter':scene&&['river-valley','pine','pass','bridge'].some(s=>scene.includes(s))?'diesel':undefined
 const pool=preferred?loadingObjects.filter(a=>a.id===preferred):loadingObjects.filter(a=>a.id!==previous)
 const object=pool[Math.floor(Math.random()*pool.length)];previous=object.id;return object
}
