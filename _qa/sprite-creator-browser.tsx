import React from 'react'
import {createRoot} from 'react-dom/client'
import SpriteCreator from '../src/sprite-creator'
import {encodeSpritePixels} from '../src/sprite-browser-io'
import '../src/style.css'
async function fixture(){const width=72,height=96,rgba=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const sx=x%24,sy=y%24,v=(Math.floor(x/3)+Math.floor(y/3))%2?225:250;const colors=[[25,80,100,255],[145,85,25,255],[30,85,170,255],[125,45,145,255]],body=colors[Math.floor(y/24)],marker=sx===8+(Math.floor(x/24)*2)&&sy>=10&&sy<15;rgba.set(sx>=7&&sx<17&&sy>=4&&sy<20?(marker?[190,170,70,255]:body):[v,v,v,255],(y*width+x)*4)}return encodeSpritePixels({width,height,rgba})}
createRoot(document.getElementById('root')!).render(<SpriteCreator fixture={new URLSearchParams(location.search).has('device')?deviceFixture:fixture} locale={new URLSearchParams(location.search).get('lang')==='en'?'en':'zh'}/>)

async function deviceFixture(){
 const width=240,height=128,rgba=new Uint8ClampedArray(width*height*4)
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const cell=Math.floor(x/80),sx=x%80,v=(Math.floor(x/4)+Math.floor(y/4))%2?225:250
  const body=sx>=24&&sx<56&&y>=30&&y<=110,door=cell>0&&sx>=10&&sx<24&&y>=56&&y<=110
  let color=[v,v,v,255]
  if(body)color=y<48?[80,120,125,255]:cell===0?[30,85,100,255]:[20,30,38,255]
  if(door)color=[130,90,35,255]
  if(body&&cell===1&&sx>=33&&sx<48&&y>=68&&y<78)color=[245,145,30,255]
  rgba.set(color,(y*width+x)*4)
 }
 return encodeSpritePixels({width,height,rgba})
}
