import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetCamera} from '../src/old-street-camera'
for(const view of [{width:320,height:568},{width:390,height:844},{width:844,height:390}])test(`camera ${view.width}x${view.height}: zoom, edge safety and pointer inversion`,()=>{
 const p={x:180,y:280},c=oldStreetCamera(view,p),overview=oldStreetCamera(view,p,true)
 assert.ok(c.scale>overview.scale)
 for(const point of [{x:64,y:32},{x:180,y:280},{x:304,y:518}]){
  const camera=oldStreetCamera(view,point)
  const screen={x:camera.x+(point.x+8)*camera.scale,y:camera.y+(point.y+26)*camera.scale}
  assert.ok(screen.y>=68&&screen.y<=Math.max(148,view.height-220))
  assert.ok(Math.abs((screen.x-camera.x)/camera.scale-8-point.x)<1e-9)
  assert.ok(Math.abs((screen.y-camera.y)/camera.scale-26-point.y)<1e-9)
 }
 assert.notEqual(oldStreetCamera(view,{x:180,y:80}).y,oldStreetCamera(view,{x:180,y:460}).y)
})
