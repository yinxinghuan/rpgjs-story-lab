import {originalCharacterWalkable,originalCharacterSafePosition} from './original-character-space'
import {originalEquipmentBodies} from './original-equipment-art'
import type {StorySave} from './vendor/original-train/types'
import {originalSceneBackgroundVersion,type OriginalAssetBindings} from './original-asset-releases'
import {originalEnvironmentWalkable} from './original-environment-layouts'
type Presence={save:StorySave;sceneId:string;assets?:OriginalAssetBindings}
type Point={x:number;y:number}
export function originalWorldWalkable(head:Presence,p:Point){
 return originalCharacterWalkable(head,p)&&originalEnvironmentWalkable(originalSceneBackgroundVersion(head.assets,head.sceneId),head.sceneId,p)&&!originalEquipmentBodies(head.sceneId,head.assets).some(b=>p.x+9>b.x&&p.x<b.x+b.w&&p.y+15>b.y&&p.y<b.y+b.h)
}
export function originalWorldSafePosition(head:Presence,p:Point){return originalCharacterSafePosition(head,p,q=>originalWorldWalkable(head,q))}
