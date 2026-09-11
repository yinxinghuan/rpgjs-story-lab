import {defineConfig,mergeConfig} from 'vite'
import main from './fan-art.vite'
// Explicit local QA only: expose read-only renderer/device observations.
export default defineConfig(async env=>mergeConfig(typeof main==='function'?await main(env):await main,{plugins:[{name:'layered-creator-qa',enforce:'pre',transform(code:string,id:string){
 if(id.split('?')[0].endsWith('/src/original-scene-preview.tsx'))return code.replace('onReady:r=>{','onReady:r=>{(window as any).__layerRenderer=r;')
 if(id.split('?')[0].endsWith('/src/layered-map-trial.tsx'))return code.replace('function mapEvents(scene:string){',';(window as any).__layerPoses=()=>Object.fromEntries([...events.current].map(([id,e])=>[id,e.animationName()]));\n function mapEvents(scene:string){')
}}]}))
