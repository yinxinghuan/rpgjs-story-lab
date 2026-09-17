import {useEffect,useState,useId} from 'react'
import {getRoofMaterial,roofMaterialSampling,type RoofMaterialId} from './material-library/roof-materials'
const samples=new Map<string,Promise<string>>()
/** Once per source+material: match effective texel density, retaining world-space tile size. */
function sampleRoof(source:string,id:RoofMaterialId){
 const key=source+'|'+id,existing=samples.get(key);if(existing)return existing
 const pending=new Promise<string>((resolve,reject)=>{
  const image=new Image();image.onload=()=>{try{const m=getRoofMaterial(id,{allowCandidate:true}),size=roofMaterialSampling(id),canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('CANVAS_UNAVAILABLE');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,m.crop.x,m.crop.y,m.crop.width,m.crop.height,0,0,size.width,size.height);resolve(canvas.toDataURL('image/png'))}catch(error){reject(error)}};image.onerror=()=>reject(Error('ROOF_TEXTURE_UNAVAILABLE'));image.src=source
 });samples.set(key,pending);if(samples.size>16)samples.delete(samples.keys().next().value!);pending.catch(()=>samples.delete(key));return pending
}
export function RoofMaterialSurface({material,source,x,y,width,height,side}:{material:RoofMaterialId;source?:string;x:number;y:number;width:number;height:number;side:'W'|'E'}){
 const patternId='os-roof-material-'+useId().replace(/:/g,''),m=getRoofMaterial(material,{allowCandidate:true}),size=roofMaterialSampling(material),[sample,setSample]=useState<{source:string;material:RoofMaterialId;url:string}>()
 useEffect(()=>{let active=true;if(source)void sampleRoof(source,material).then(url=>{if(active)setSample({source,material,url})}).catch(()=>{});return()=>{active=false}},[source,material])
 const image=sample&&sample.source===source&&sample.material===material?sample.url:undefined,west=side==='W',edge=west?x+width:x
 return <g data-roof-material={material} data-roof-sampled={image?'true':'false'}>
  <defs><pattern id={patternId} x={west?edge-size.worldWidth:x} y={y} width={size.worldWidth} height={size.worldHeight} patternUnits="userSpaceOnUse">{image?<image href={image} width={size.worldWidth} height={size.worldHeight} preserveAspectRatio="none" style={{imageRendering:'pixelated'}}/>:source?<svg width={size.worldWidth} height={size.worldHeight} viewBox={`${m.crop.x} ${m.crop.y} ${m.crop.width} ${m.crop.height}`} preserveAspectRatio="none" overflow="hidden"><image href={source} width={m.image.width} height={m.image.height} style={{imageRendering:'pixelated'}}/></svg>:null}</pattern></defs>
  <rect x={x} y={y} width={width} height={height} fill={m.fallback}/>
  {source&&<rect x={x} y={y} width={width} height={height} fill={`url(#${patternId})`}/>}
  {!m.gutterInSource&&<g><rect x={west?edge-4:edge} y={y} width="4" height={height} fill="#455349"/><path d={`M${west?edge-3:edge+2} ${y}v${height}`} stroke="#9f9d7d" strokeWidth="1"/><path d={`M${west?edge-1:edge} ${y}v${height}`} stroke="#293a32" strokeWidth="1"/></g>}
 </g>
}
