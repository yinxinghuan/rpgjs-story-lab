import React from 'react'
import type {OriginalHead} from '../server/original-train-runtime'
import {originalSceneBackgroundVersion} from './original-asset-releases'
import {originalEnvironmentLayouts} from './original-environment-layouts'
import {originalTrainObstaclesFor} from './original-train-spatial-plan'
import {originalEquipmentBodies} from './original-equipment-art'
/** The same immutable collision footprints as movement, never invented scenery. */
export default function OriginalSceneSilhouette({head}:{head:OriginalHead}){
 const id=originalSceneBackgroundVersion(head.assets,head.sceneId),layout=id?originalEnvironmentLayouts[id]:undefined
 const obstacles=layout?.scene===head.sceneId?layout.obstacles:originalTrainObstaclesFor(head.sceneId)
 return <svg className="og-silhouette" viewBox="0 0 384 576" aria-hidden="true"><rect width="384" height="576" fill="#354248"/>{[...obstacles,...originalEquipmentBodies(head.sceneId,head.assets)].map((r,i)=><rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#172630" stroke="#a7967044" strokeWidth="1"/>)}</svg>
}
