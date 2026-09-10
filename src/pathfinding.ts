import type {SceneId} from './scene-layout'
import {walkable,type Position} from './contract'
import {findGridPath} from './grid-path'
export function findPath(start:Position,destination:Position,scene:SceneId='carriage'){return findGridPath(start,destination,p=>walkable(p,scene))}
