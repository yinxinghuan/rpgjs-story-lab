import { defineConfig } from 'vite'
import canvasengine from '@canvasengine/compiler'
import { labPlugin } from './server/service'
export default defineConfig(({mode})=>({base:'./',plugins:[canvasengine(),...(mode==='pages'?[]:[labPlugin()])],resolve:{dedupe:['@signe/reactive','@signe/di','canvasengine','pixi.js','@rpgjs/common']},optimizeDeps:{include:['pixi.js > @xmldom/xmldom']}}))
