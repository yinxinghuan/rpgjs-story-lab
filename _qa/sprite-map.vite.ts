import {defineConfig,mergeConfig} from 'vite'
import main from '../vite.config'
import {resolve} from 'node:path'
// Build the real map/creator entries and inject the synthetic creator fixture only
// into this temporary QA build. Ordinary npm run build never includes this input.
export default defineConfig(async env=>mergeConfig(typeof main==='function'?await main(env):await main,{build:{outDir:'/private/tmp/rpgjs-sprite-map-qa',emptyOutDir:true,rollupOptions:{input:{spriteCreatorQa:resolve('_qa/sprite-creator.html')}}}}))
