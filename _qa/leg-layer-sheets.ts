import type {Direction} from '@rpgjs/common'
import legImage from '../doc/platform-art-candidates/20260913/hero-leg-neutral-09/candidate-alpha-gap.png'
import {originalHeroSheet} from '../src/original-hero-sheet'
import type {OriginalAssetBindings} from '../src/original-asset-releases'
/** Renderer-only experiment: immutable PNGs, no composited image or save mutation. */
export function legTrialSheets(image:string,assets?:OriginalAssetBindings){
 const base=originalHeroSheet(image,assets)
 if(base.width!==1086||base.height!==1448)throw Error('QA_LEG_BASELINE_REQUIRED')
 for(const texture of Object.values(base.textures)){
  const original=texture.animations
  texture.animations=(args:{direction:Direction})=>original(args).map(row=>row.map(frame=>({...frame,opacity:args.direction==='up'?0:1})))
 }
 const poses=['stand','stride-0','stride-1','stride-2','walk']
 const upperTextures=Object.fromEntries(poses.map(pose=>[pose,{animations:({direction}:{direction:Direction})=>[[{frameX:0,frameY:0,time:0,anchor:[181/362,330/278],scale:[.14,.14],x:4.5,y:15,opacity:direction==='up'?1:0}]]}]))
 const legsTextures=Object.fromEntries(poses.map(pose=>[pose,{animations:({direction}:{direction:Direction})=>[[{frameX:['stand','stride-1'].includes(pose)?1:0,frameY:0,time:0,anchor:[155/320,305/320],scale:[pose==='stride-2'?-.056:.056,.056],x:4.5,y:15,opacity:direction==='up'?1:0}]]}]))
 return [base,{id:'trial-legs',image:legImage,width:640,height:320,framesWidth:2,framesHeight:1,textures:legsTextures},{id:'trial-body',image,width:1086,height:1448,framesWidth:1,framesHeight:1,rectWidth:362,rectHeight:278,offset:{x:362,y:1086},textures:upperTextures}]
}
