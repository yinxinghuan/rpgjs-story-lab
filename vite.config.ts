import { defineConfig } from 'vite'
import canvasengine from '@canvasengine/compiler'
import { labPlugin } from './server/service'
import {preflightPlugin} from './server/preflight-plugin'
export default defineConfig(({mode})=>({base:'./',plugins:[canvasengine(),...(mode==='cloud-preflight'?[preflightPlugin()]:['pages','cloud'].includes(mode)?[]:[labPlugin()])],resolve:{dedupe:['@signe/reactive','@signe/di','canvasengine','pixi.js','@rpgjs/common']},optimizeDeps:{include:['pixi.js > @xmldom/xmldom']}}))
