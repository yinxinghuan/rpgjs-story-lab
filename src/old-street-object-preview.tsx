import type {StorySave} from './vendor/original-train/types'
import {oldStreetDrawerPose,oldStreetCompartmentPose} from './old-street-prop-art'
import {oldStreetPropState} from './old-street-prop-state'
import './old-street-object-preview.css'

/** Explicitly admitted objects only; no generic stock image for other interactions. */
export function OldStreetObjectPreview({target,save,drawer,cabinet}:{target:string;save:Pick<StorySave,'facts'|'locale'>;drawer:string;cabinet:string}){
 const isDrawer=target==='drawer',admitted=isDrawer||target==='letter-compartment'
 const pose=isDrawer?oldStreetDrawerPose(save):oldStreetCompartmentPose(save)
 const frame=pose==='closed'?0:pose==='open'?1:2
 const title=oldStreetPropState(target,save)?.[save.locale==='zh'?0:1]??''
 if(!admitted)return null
 const art=<svg viewBox={isDrawer?`${frame*512+94} 172 340 350`:`${frame%2*512+86} ${Math.floor(frame/2)*512+80} 350 370`} role="img" aria-label={title}>
  <image href={isDrawer?drawer:cabinet} width={isDrawer?1536:1024} height={isDrawer?768:1024}/>
 </svg>
 return <div className="os-object-preview">{art}</div>
}
