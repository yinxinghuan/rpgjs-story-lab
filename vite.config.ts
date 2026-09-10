import { defineConfig } from 'vite'
import canvasengine from '@canvasengine/compiler'
import { labPlugin } from './server/service'
import {preflightPlugin} from './server/preflight-plugin'
import {sceneResourceManifest} from './server/scene-resource-manifest'
export default defineConfig(({mode})=>({base:'./',define:{__SCENE_RESOURCES__:JSON.stringify(sceneResourceManifest()),__QA_PERFORMANCE__:JSON.stringify(mode==='pages'&&process.env.CARRIAGE_QA_PERF==='1')},plugins:[canvasengine(),...(mode==='cloud-preflight'?[preflightPlugin()]:['pages','cloud'].includes(mode)?[]:[labPlugin()])],resolve:{dedupe:['@signe/reactive','@signe/di','canvasengine','pixi.js','@rpgjs/common']},optimizeDeps:{include:['pixi.js > @xmldom/xmldom']}}))
