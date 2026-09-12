/** The DOM backdrop and RPG-JS canvas share a whole-map coordinate system.
 * RPG-JS resets its default player-follow camera on room changes; that camera
 * must not independently translate the transparent character layer.
 */
const fixedTarget='__alteru-fixed-map-origin__'
type DisplayNode={children?:DisplayNode[];x?:number;y?:number;destroyed?:boolean;toWorld?:unknown;moveCorner?:(x:number,y:number)=>unknown}
export function keepWholeMapCamera(engine:{cameraFollowTargetId:()=>string|null;setCameraFollow:(id:string,smooth:boolean)=>void}){
 if(engine.cameraFollowTargetId()!==fixedTarget)engine.setCameraFollow(fixedTarget,false)
 // beta.34 has no public viewport getter. This isolated adapter follows its
 // RpgClientEngine.findViewportInstance implementation; dependencies are pinned.
 // Removing follow alone leaves the previous room's moveCenter translation.
 function find(node:DisplayNode|undefined):DisplayNode|undefined{
  if(!node)return
  if(typeof node.toWorld==='function'&&typeof node.moveCorner==='function')return node
  for(const child of node.children??[]){const viewport=find(child);if(viewport)return viewport}
 }
 // A room may detach a viewport before destroying it. Resolve from the live
 // stage, as the pinned engine does, instead of retaining the previous room.
 const viewport=find((engine as unknown as {canvasApp?:{stage?:DisplayNode}}).canvasApp?.stage)
 if(viewport&&(viewport.x!==0||viewport.y!==0))viewport.moveCorner!(0,0)
}
