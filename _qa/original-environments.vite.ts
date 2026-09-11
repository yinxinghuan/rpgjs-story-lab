import {defineConfig,mergeConfig} from 'vite'
import main from '../vite.config'
// Read-only actual renderer access in this explicit loopback QA build only.
export default defineConfig(async env=>mergeConfig(typeof main==='function'?await main(env):await main,{plugins:[{name:'original-environment-qa-motion',enforce:'pre',transform(code:string,id:string){if(!id.split('?')[0].endsWith('/src/original-game.tsx'))return;const target='onReady:r=>{runtime.current=r;resolve()}';if(!code.includes(target))throw Error('ENVIRONMENT_QA_INJECTION_CHANGED');return code.replace(target,'onReady:r=>{(window as any).__environmentQa=r;runtime.current=r;resolve()}')}}]}))
