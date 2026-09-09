import React from 'react'
import {type SceneId} from './scene-layout'
import type {StorySave} from './story'
import {projectWorldObjects} from './world-objects'
import {getSpace} from './space-bridge'
import {extraArt} from './art-catalog'
export const extraCrops=extraArt.crops
export function ExtraArt({state,className='',style}:{state:string;className?:string;style?:React.CSSProperties}){const [x,y,w,h]=extraCrops[state];return <svg data-art={state} className={className} style={style} viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><image href={extraArt.path} width={extraArt.width} height={extraArt.height}/></svg>}
// The engine owns map-object depth; DOM art remains only for inventory and close-ups.
export function WorldArt({scene,save}:{scene:SceneId;save:StorySave}){
 React.useEffect(()=>{const sync=()=>getSpace()?.setObjects(scene,projectWorldObjects(scene,save));sync();window.addEventListener('space-ready',sync);return()=>window.removeEventListener('space-ready',sync)},[scene,save])
 return null
}
