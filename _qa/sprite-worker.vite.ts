import {defineConfig} from 'vite'
import {resolve} from 'node:path'
export default defineConfig({base:'./', publicDir:false, build:{outDir:'/private/tmp/rpgjs-synthetic-sprite-worker',emptyOutDir:true,rollupOptions:{input:resolve('_qa/sprite-worker.html')}}})
