import {defineConfig,mergeConfig} from 'vite'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import base from '../vite.config'
// Dedicated local storage, same application, maps, movement and story runtime.
// Build first: originalScenePreviewPlugin emits maps during generateBundle.
// Production config never imports this file or the candidate sheet module.
export default defineConfig(env=>{
 if(env.mode!=='cloud-preflight'||(env.command==='serve'&&!env.isPreview))throw Error('QA_LEG_BUILD_THEN_LOCAL_PREVIEW_ONLY')
 process.env.CARRIAGE_QA_DATABASE_DIR=join(tmpdir(),'rpg-leg-layer-20260913')
 process.env.CARRIAGE_QA_ORIGINAL_MODEL_BUDGET='0'
 return mergeConfig(base(env),{plugins:[{name:'qa-leg-layer-preview',enforce:'pre',
  transform(code:string,id:string){
   if(!id.split('?')[0].endsWith('/src/original-game.tsx'))return
   const before="heroGraphic:'hero',spritesheets:[originalHeroSheet(heroBlob.current,next.assets),"
   if(code.split(before).length!==2)throw Error('QA_HERO_RENDERER_HOOK_CHANGED')
   const active="new URLSearchParams(location.search).get('leg_trial')==='1'"
   return {code:"import {legTrialSheets} from '../_qa/leg-layer-sheets'\n"+code.replace(before,`heroGraphic:(${active}?['hero','trial-legs','trial-body']:'hero') as any,spritesheets:[...(${active}?legTrialSheets(heroBlob.current,next.assets):[originalHeroSheet(heroBlob.current,next.assets)]),`),map:null}
  },
  transformIndexHtml(html:string){return html.replace('</body>','<aside style="position:fixed;right:8px;top:8px;z-index:99999;background:#18242b;color:#fff;padding:8px;font:14px system-ui">背向图层试验 · 未准入<br><a style="color:#fff;display:inline-block;padding:14px" href="?story=original&leg_trial=1">背向候选</a><a style="color:#fff;display:inline-block;padding:14px" href="?story=original&leg_trial=0">基准角色</a></aside></body>')}
 }]})
})
