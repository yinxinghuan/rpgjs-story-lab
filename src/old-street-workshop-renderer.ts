import type {RpgRendererOptions} from './rpg-renderer'
import type {RpgPlayer} from '@rpgjs/server'
import {findGridPath} from './grid-path'
import {inWorkshop,workshopGeometry,workshopWalkable,type OldStreetPresentationHead} from './old-street-workshop'
/** Keep the real renderer and its transition handshake. Only an admitted head
 * may register the extra scene; a label alone never activates a map. */
export function withWorkshopRenderer(options:RpgRendererOptions,head:()=>OldStreetPresentationHead|undefined):RpgRendererOptions{
 const room=head()?.restoration?.room
 if(!room)return options
 return {...options,sceneIds:[...options.sceneIds,room.id],mapIds:{...options.mapIds,[room.id]:'oldstreet-workshop'},
  walkable:(p,s)=>inWorkshop(head(),s)?workshopWalkable(p):options.walkable(p,s),
  safePosition:(p,s)=>inWorkshop(head(),s)?workshopWalkable(p)?p:workshopGeometry.spawn:options.safePosition(p,s),
  findPath:(a,b,s)=>inWorkshop(head(),s)?findGridPath(a,b,workshopWalkable):options.findPath(a,b,s),
  mapEvents:s=>s!==room.id?options.mapEvents(s):workshopGeometry.entities.filter(e=>e.body).map(e=>({id:'oldstreet-workshop-'+e.id,x:e.body!.x,y:e.body!.y,event:{onInit(this:RpgPlayer){
   this.setHitbox(e.body!.w,e.body!.h);this.through=true;this.animationFixed=true
   // Reuse the original independent wooden surface and record stand. These
   // are material/placeholders, not newly generated illustrations or evidence.
   this.setGraphic(e.id==='old-sign'?'oldstreet-letter-compartment-top':'oldstreet-record-book')
   this.animationName.set(e.id==='old-sign'?'closed':'stand');this.syncChanges()
  }}})),
 }
}
