// Runtime art metadata shared by rendering, inventory export and the production kit.
// The approved viewing angle is a visual reference, not an inferred camera degree.
export const artDirection={id:'orthogonal-overhead-b-v1',approvedAt:'2026-09-09',status:'user-approved',projection:'orthogonal-overhead',referenceVersion:'alpha-20260909'} as const
export type ActorArt={path:string;width:number;height:number;columns:3;rows:4;scale:number;baselines:number[][];centers:number[][]}
const centers=()=>Array.from({length:4},()=>[195,181,167])
const balanced=(name:string):ActorArt=>({path:`./art/overhead/${name}.png`,width:1086,height:1448,columns:3,rows:4,scale:.14,baselines:Array.from({length:4},()=>[330,330,330]),centers:Array.from({length:4},()=>[181,181,181])})
export const actorArt:Record<'balanced'|'baseline',Record<'hero'|'mechanic'|'attendant',ActorArt>>={
 balanced:{attendant:balanced('attendant'),hero:{...balanced('hero'),path:'./art/overhead/hero-gait-v2.png'},mechanic:balanced('mechanic')},
 baseline:{attendant:balanced('attendant'),hero:{path:'./art/hero-study.png',width:1086,height:1448,columns:3,rows:4,scale:.14,centers:centers(),baselines:[[333,330,336],[311,312,311],[302,302,302],[301,295,301]]},mechanic:{path:'./art/mechanic-v2.png',width:1086,height:1448,columns:3,rows:4,scale:.14,centers:centers(),baselines:[[337,337,337],[313,313,313],[302,302,303],[295,295,296]]}}
}
export const propsArt:Record<'balanced'|'baseline',{path:string;width:number;height:number;crops:Record<string,number[]>}>={
 balanced:{path:'./art/overhead/props.png',width:1312,height:1199,crops:{closed:[150,24,256,420],open:[516,24,270,420],empty:[906,24,270,420],broken:[72,488,340,272],repaired:[480,488,335,272],fuse:[904,568,304,118],locked:[155,820,250,350],doorOpen:[517,820,260,350]}},
 baseline:{path:'./art/props-v2.png',width:1312,height:1199,crops:{closed:[70,0,340,475],open:[470,0,340,475],empty:[870,0,340,475],broken:[70,480,330,280],repaired:[470,480,330,280],fuse:[885,575,315,125],locked:[125,770,270,415],doorOpen:[510,770,270,415]}}
}
export const extraArt={path:'./art/train-equipment.png',width:1536,height:1024,crops:{crate:[2,2,519,529],record:[605,2,340,514],battery:[1017,2,515,529],unpowered:[2,537,519,484],powered:[528,537,479,484],connected:[1017,537,515,484]} as Record<string,number[]>}
export const assetPath=(path:string)=>'public/'+path.replace(/^\.\//,'')
