// Shared world-pixel layout: rendering, navigation and authority read the same data.
export type SceneId='carriage'|'baggage'|'cab'|'walkway'
export type Rect={x:number;y:number;w:number;h:number}
export type Point={x:number;y:number}
export const carriage={x:134,y:10,w:116,h:528} as const
export const interior={x:150,y:76,w:84,h:452} as const
export const seats=[216,272,328,384,440].flatMap((y,row)=>[
 {id:`seat-${row}-west`,x:150,y,w:24,h:30},
 {id:`seat-${row}-east`,x:210,y,w:24,h:30},
])
export const seatSource={x:195,y:130,w:783,h:1008,imageWidth:1173,imageHeight:1341} as const
export const npcFoot={x:222,y:184} as const
export const attendantFoot={x:222,y:260} as const
export const fixtures=[{x:150,y:84,w:22,h:44},{x:208,y:103,w:26,h:22}]
export const cargo=[{id:'cargo-a',x:150,y:280,w:24,h:24},{id:'cargo-b',x:210,y:338,w:24,h:24},{id:'cargo-c',x:150,y:396,w:24,h:24}]
export type Furniture=Rect&{id:string;art:'seat'|'crate'}
export const sceneIds:SceneId[]=['carriage','baggage','cab','walkway']
export const scenes:Record<SceneId,{label:[string,string];background:string;interior:Rect;spawn:Point;furniture:Furniture[];fixtures:Rect[];npc?:Point;resident?:{id:string;graphic:string}}>={
 walkway:{label:['轨旁接应步道','Trackside reception walkway'],background:'./art/rescue-walkway.png',interior:{x:150,y:70,w:84,h:458},spawn:{x:188,y:488},furniture:[],fixtures:[{x:164,y:76,w:56,h:52}]},
 carriage:{label:['07 号客厢','Carriage 07'],background:'./art/carriage-narrow.png',interior,spawn:{x:186,y:500},furniture:seats.map(s=>({...s,art:'seat'})),fixtures,npc:npcFoot,resident:{id:'lin',graphic:'mechanic'}},
 baggage:{label:['06 号行李检修车','Baggage & service car'],background:'./art/baggage-car.png',interior:{x:144,y:76,w:96,h:422},spawn:{x:188,y:464},npc:attendantFoot,resident:{id:'zhou-yu',graphic:'attendant'},furniture:cargo.map(s=>({...s,art:'crate'})),fixtures:[{x:150,y:112,w:22,h:44},{x:216,y:196,w:16,h:24}]},
 cab:{label:['驾驶室','Driving cab'],background:'./art/driving-cab.png',interior:{x:150,y:240,w:84,h:288},spawn:{x:188,y:464},furniture:[{id:'driver-seat',x:210,y:304,w:24,h:30,art:'seat'}],fixtures:[{x:164,y:184,w:56,h:52}]},
}
export const approachPoints={rearExit:{x:188,y:498},walkwayBack:{x:188,y:498},callpoint:{x:188,y:144},'zhou-yu':{x:190,y:260},cabinet:{x:158,y:132},panel:{x:220,y:132},lin:{x:188,y:184},exit:{x:188,y:80},supply:{x:158,y:160},record:{x:192,y:216},forward:{x:188,y:80},back:{x:188,y:472},radio:{x:188,y:248},cabBack:{x:188,y:472}} as const
export function sceneObstacles(scene:SceneId):Rect[]{const s=scenes[scene],r=s.interior;return [{x:0,y:0,w:384,h:r.y},{x:0,y:r.y+r.h,w:384,h:576-r.y-r.h},{x:0,y:0,w:r.x,h:576},{x:r.x+r.w,y:0,w:384-r.x-r.w,h:576},...s.furniture,...s.fixtures,...(s.npc?[{x:s.npc.x-4.5,y:s.npc.y-15,w:9,h:15}]:[])]}
export const portalArrivals:Record<string,{scene:SceneId;position:Point}>={'enter-walkway':{scene:'walkway',position:{x:188,y:488}},'return-carriage':{scene:'carriage',position:{x:188,y:488}},leave:{scene:'baggage',position:{x:188,y:464}},'go-baggage':{scene:'baggage',position:{x:188,y:464}},'back-carriage':{scene:'carriage',position:{x:188,y:88}},'enter-cab':{scene:'cab',position:{x:188,y:464}},'back-baggage':{scene:'baggage',position:{x:188,y:88}}}
