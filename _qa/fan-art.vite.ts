import {defineConfig,mergeConfig} from 'vite'
import main from './original-environments.vite'
// Only explicit local QA builds expose current rendered device animation names.
export default defineConfig(async env=>mergeConfig(typeof main==='function'?await main(env):await main,{plugins:[{name:'fan-layer-qa',enforce:'pre',transform(code:string,id:string){if(!id.split('?')[0].endsWith('/src/original-game.tsx'))return;const target='onReady:r=>{';if(!code.includes(target))throw Error('FAN_QA_INJECTION_CHANGED');return code.replace(target,target+'(window as any).__fanQa=()=>Object.fromEntries([...equipmentEvents.current].map(([id,{event,layer}])=>[id,{layer,animation:event.animationName()}]));')}}]}))
