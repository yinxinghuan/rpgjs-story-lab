import React from 'react'
import {scenes,seatSource,type SceneId,type Rect} from './scene-layout'
import {visualStates} from './visual-states'
import {states} from './contract'
import type {StorySave} from './story'
import {PropArt} from './prop-art'
import {extraArt} from './art-catalog'
export const extraCrops=extraArt.crops
export function ExtraArt({state,className='',style}:{state:string;className?:string;style?:React.CSSProperties}){const [x,y,w,h]=extraCrops[state];return <svg data-art={state} className={className} style={style} viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><image href={extraArt.path} width={extraArt.width} height={extraArt.height}/></svg>}
const at=(r:Rect):React.CSSProperties=>({position:'absolute',left:r.x/384*100+'%',top:r.y/576*100+'%',width:r.w/384*100+'%',height:r.h/576*100+'%'})
const door=(id:string,r:Rect,state='doorOpen')=><div key={id} style={at(r)} className="cl-fixture"><PropArt state={state}/></div>
export function WorldArt({scene,save}:{scene:SceneId;save:StorySave}){const f=save.facts,vs=states(save);return <>
 <div className="cl-props">
 {scene==='carriage'?<><PropArt className="cl-prop cl-prop--cabinet" state={visualStates.cabinet[vs.cabinet]}/><PropArt className="cl-prop cl-prop--panel" state={visualStates.panel[vs.panel]}/><PropArt className="cl-prop cl-prop--exit" state={visualStates.exit[vs.exit]}/></>:scene==='baggage'?<>
 <div className="cl-fixture" style={at({x:138,y:108,w:40,h:50})}><PropArt state={visualStates.supply[vs.supply]}/></div>
 {f.supply_open&&!f.battery_taken&&<ExtraArt state="battery" className="cl-prop" style={at({x:157,y:132,w:9,h:8})}/>}
 <ExtraArt state={visualStates.record[vs.record]} className="cl-prop" style={at({x:216,y:196,w:16,h:24})}/>
 {door('front',{x:173,y:28,w:38,h:52})}{door('back',{x:173,y:492,w:38,h:43})}
 </>:<><ExtraArt state={visualStates.radio[vs.radio]} className="cl-prop" style={at({x:164,y:184,w:56,h:52})}/>{door('back',{x:173,y:494,w:38,h:43})}</>}
 </div>
 <div className="cl-furniture" aria-hidden="true">{scenes[scene].furniture.map(item=>item.art==='crate'?<ExtraArt key={item.id} state="crate" className="cl-bench" style={at(item)}/>:<svg key={item.id} data-bench={item.id} className="cl-bench" viewBox={`${seatSource.x} ${seatSource.y} ${seatSource.w} ${seatSource.h}`} preserveAspectRatio="none" style={at(item)}><image href="./art/seat.png" width={seatSource.imageWidth} height={seatSource.imageHeight}/></svg>)}</div>
 </>}
