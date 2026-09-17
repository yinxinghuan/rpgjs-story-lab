import type {StorySave} from './vendor/original-train/types'
import {roofGap,roofBridge} from './old-street-roof-recovery'
/** Art is projected onto the same measured gap and crossing used by collision. */
export function OldStreetRoofRecovery({room,save,wood,cabinet}:{room:string;save:Pick<StorySave,'facts'>;wood:string;cabinet:string}){
 const f=save.facts
 if(!f['roof-recovery'])return null
 if(room!=='roof')return null
 const open=!!f['roof-box-open'],empty=!!f['roof-negative-taken'],laid=!!f['roof-bridge-laid']
 return <g aria-hidden="true">
  <defs><pattern id="os-roof-plank-texture" patternUnits="userSpaceOnUse" width="40" height="74"><image href={wood} width="40" height="74" preserveAspectRatio="none"/></pattern></defs>
  <rect x={roofGap.x} y={roofGap.y} width={roofGap.w} height={roofGap.h} fill="#1e2321"/>
  <path d="M48 216h52v4h36v-4h26v6h28v-6h32v4h46v-4h68M48 260h42v-4h34v4h46v-3h38v3h39v-5h35v5h54" fill="none" stroke="#615c50" strokeWidth="4"/>
  {laid&&<g><rect x={roofBridge.x} y={roofBridge.y} width={roofBridge.w} height={roofBridge.h} fill="url(#os-roof-plank-texture)" stroke="#473725" strokeWidth="2"/><path d="M190 210v56m12-56v56" stroke="#826644" strokeWidth="1"/></g>}
  {!laid&&<rect x="232" y="364" width={roofBridge.w} height={roofBridge.h} fill="url(#os-roof-plank-texture)" stroke="#473725" strokeWidth="2"/>}
  <rect x="276" y="378" width="40" height="30" fill="url(#os-roof-plank-texture)" stroke="#473725" strokeWidth="2"/>
  <svg x="144" y="76" width="96" height="96" viewBox={`${open&&!empty?512:0} ${empty?512:0} 512 512`} overflow="hidden"><image href={cabinet} width="1024" height="1024" style={{imageRendering:'pixelated'}}/></svg>
 </g>
}
