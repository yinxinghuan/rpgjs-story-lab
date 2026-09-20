import sideMaterials from './material-library/side-door-catalog.json'
import {useId} from 'react'
import {sideLeafPlacement,type SideDoor} from './old-street-side-door-layout'
import type {OldStreetEnvironmentArt} from './old-street-environment-art'
/** Shared short threshold: floor in the back, near end under the foreground scene wall. */
export function OldStreetSidePassage({door,art,foreground=false}:{door:SideDoor;art:OldStreetEnvironmentArt;foreground?:boolean}){
 const id='short-passage-'+useId().replace(/:/g,''),x=door.position.x+(door.side==='W'?-4:4)
 return <g data-side-passage={foreground?'near-jamb':'floor-and-far-jamb'} data-door-id={door.id} transform={`translate(${x} ${door.position.y}) scale(${56/251}) translate(-384 -307.5)`}>
  <defs><clipPath id={id}><rect x={foreground?349:0} y={foreground?313:0} width={foreground?71:768} height={foreground?122:512}/></clipPath></defs>
  <image href={art.entranceShortPassage} width="768" height="512" clipPath={`url(#${id})`} style={{imageRendering:'pixelated',filter:`brightness(${sideMaterials.threshold.tone.brightness}) saturate(${sideMaterials.threshold.tone.saturation})`}}/>

 </g>
}
/** Complete native-projection slab, including its painted thickness. Text-bearing leaves never mirror. */
export function OldStreetSideDoorLeaf({door,art,closed,foreground=false,actor}:{door:SideDoor;art:OldStreetEnvironmentArt;closed:boolean;foreground?:boolean;actor?:{x:number;y:number};locale?:'zh'|'en'}){
 const p=sideLeafPlacement(door),inFront=!actor||actor.y+26<=p.y+1
 if(p.style.leaf==='none'||foreground!==inFront)return null
 const material=sideMaterials.leaves[p.style.leaf],b=material.bounds
 const scale=p.width/b.width,width=p.width,height=b.height*scale
 if(closed)return <g data-side-door-leaf="closed-edge" data-door-id={door.id}>
  <rect x={p.x-2} y={door.position.y-28-height} width="4" height={56+height} fill={material.edge} stroke={material.outline} strokeWidth=".7"/>
  <path d={`M${p.x-1} ${door.position.y-28-height}v56`} stroke={material.top} strokeWidth="1.5"/>
 </g>
 if(!p.towardRoom)return null
 const left=p.direction>0?0:-width
 const mirror=(p.direction>0)!==(material.hinge==='left')
 // Fallback to the admitted threshold if a future recipe lacks its matching lettering orientation.
 if(mirror&&material.lettering)return null
 return <g data-side-door-leaf="open-face" data-door-id={door.id} data-opens-into={p.style.opensInto} data-door-recipe="native-projection-slab-v3" transform={`translate(${p.x} ${p.y})`}>
  <g transform={`translate(${left} ${-height})`}><g transform={mirror?`translate(${width} 0) scale(-1 1)`:undefined}>
   <image data-door-leaf-image="complete-panel" href={art[material.assetKey as keyof OldStreetEnvironmentArt]} x={-b.x*scale} y={-b.y*scale} width={material.width*scale} height={material.height*scale} style={{imageRendering:'pixelated'}}/>
  </g></g>
 </g>
}
