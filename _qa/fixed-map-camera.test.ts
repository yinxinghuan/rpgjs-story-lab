import {test} from 'node:test'
import assert from 'node:assert/strict'
import {keepWholeMapCamera} from '../src/fixed-map-camera'

test('room reset and late viewport mounting cannot retain a player-centered offset',()=>{
 let target:string|null=null,calls=0
 const other={x:17,y:23}
 const engine={cameraFollowTargetId:()=>target,setCameraFollow:(id:string)=>{target=id;calls++},canvasApp:{stage:{children:[] as any[]}}}
 const viewport=()=>({x:-12,y:-142,destroyed:false,toWorld(){},moveCorner(x:number,y:number){this.x=x;this.y=y}})
 keepWholeMapCamera(engine)
 const first=viewport();engine.canvasApp.stage.children=[{children:[other,first]}]
 keepWholeMapCamera(engine)
 assert.deepEqual([first.x,first.y],[0,0]);assert.deepEqual(other,{x:17,y:23})
 keepWholeMapCamera(engine);assert.equal(calls,1)
 target=null;first.y=-142;keepWholeMapCamera(engine)
 assert.equal(calls,2);assert.equal(first.y,0)
 first.destroyed=true;const next=viewport();engine.canvasApp.stage.children=[next]
 keepWholeMapCamera(engine);assert.deepEqual([next.x,next.y],[0,0])
})

test('a detached but not destroyed viewport must not mask the current room viewport',()=>{
 let target:string|null=null
 const old={x:-10,y:-30,destroyed:false,toWorld(){},moveCorner(x:number,y:number){this.x=x;this.y=y}}
 const current={...old,x:-90,y:-180}
 const engine={cameraFollowTargetId:()=>target,setCameraFollow:(id:string)=>{target=id},canvasApp:{stage:{children:[old]}}}
 keepWholeMapCamera(engine)
 engine.canvasApp.stage.children=[current]
 keepWholeMapCamera(engine)
 assert.deepEqual([current.x,current.y],[0,0])
})
