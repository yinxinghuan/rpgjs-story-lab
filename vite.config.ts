import { defineConfig } from 'vite'
import canvasengine from '@canvasengine/compiler'
import { labPlugin } from './server/service'
import {preflightPlugin} from './server/preflight-plugin'
import {sceneResourceManifest} from './server/scene-resource-manifest'
import {originalScenePreviewPlugin,originalScenePreviewDefinition,originalStoryPreviewDefinition} from './server/original-scene-preview'
export default defineConfig(({mode})=>({base:'./',build:{rollupOptions:{input:{index:'index.html',creator:'creator.html'}}},define:{__ORIGINAL_STORY_PREVIEW__:JSON.stringify(mode==='cloud-preflight'?originalStoryPreviewDefinition():null),__ORIGINAL_SCENE_PREVIEW__:JSON.stringify(originalScenePreviewDefinition()),__SCENE_RESOURCES__:JSON.stringify(sceneResourceManifest()),__QA_PERFORMANCE__:JSON.stringify(mode==='pages'&&process.env.CARRIAGE_QA_PERF==='1')},plugins:[canvasengine(),originalScenePreviewPlugin(mode==='cloud-preflight'),...(mode==='cloud-preflight'?[preflightPlugin()]:['pages','cloud'].includes(mode)?[]:[labPlugin()])],resolve:{dedupe:['@signe/reactive','@signe/di','canvasengine','pixi.js','@rpgjs/common']},optimizeDeps:{include:['pixi.js > @xmldom/xmldom']}}))
