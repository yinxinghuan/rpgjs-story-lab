import {GAME_ID} from './game-id'
import {deploymentScope} from './vendor/space-motion/storage-scope'
export function browserStorageName(hostname:string,pathname:string){return 'alteru:'+deploymentScope(GAME_ID,hostname,pathname)+':pages-journeys-v1'}
