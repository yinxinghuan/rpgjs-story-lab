import {selectRuntime} from './runtime-selection'
export const runtimeKind=selectRuntime(import.meta.env.MODE,location.hostname,location.search)
export const isBrowserEdition=runtimeKind==='browser'
export const isCloudEdition=runtimeKind==='cloud'
export const isMirrorEdition=runtimeKind==='mirror'
