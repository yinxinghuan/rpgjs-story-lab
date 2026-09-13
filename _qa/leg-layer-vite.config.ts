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
   return {code:"import {legTrialSheets} from '../_qa/leg-layer-sheets'\n"+code.replace(before,`heroGraphic:(${active}?['hero','trial-legs','trial-neutral-left','trial-neutral-right','trial-body']:'hero') as any,spritesheets:[...(${active}?legTrialSheets(heroBlob.current,next.assets,new URLSearchParams(location.search).get('leg_neutral')==='shared'):[originalHeroSheet(heroBlob.current,next.assets)]),`).replace('  <section className="og-world"',`  {new URLSearchParams(location.search).has('leg_controls')&&<aside style={{position:'fixed',left:8,top:100,zIndex:40,width:245,padding:8,background:'#18242b',color:'#fff'}} aria-label="步态测试控制"><p>步态测试 · 每次最多行走 1.5 秒</p>{[[0,-1,'向上行走'],[0,1,'向下行走'],[-1,0,'向左行走'],[1,0,'向右行走']].map(([x,y,label])=><button key={String(label)} disabled={!ready||busy||Boolean(panel)||Boolean(error)} onClick={()=>{const target=runtime.current;if(!target)return;target.move(Number(x),Number(y));setTimeout(()=>{target.move(0,0);if(runtime.current===target)setPosition(target.position())},1500)}}>{String(label)}</button>)}<button onClick={()=>{runtime.current?.move(0,0);if(runtime.current)setPosition(runtime.current.position())}}>停止行走</button><output style={{display:'block',whiteSpace:'pre-wrap',fontSize:12}}>{JSON.stringify(runtime.current?.motion?.(),null,2)}</output></aside>}
  <section className="og-world"`),map:null}
  },
  transformIndexHtml(html:string){return html.replace('</body>','<style>html.qa-leg-zoom .og-map{width:1400px}</style><script>if(new URLSearchParams(location.search).has("leg_zoom"))document.documentElement.classList.add("qa-leg-zoom")</script><aside id="qa-art-switch" style="position:fixed;right:8px;top:8px;z-index:99999;background:#18242b;color:#fff;padding:8px;font:14px system-ui">背向图层试验 · 未准入<br><a style="color:#fff;display:inline-block;padding:14px" href="?story=original&leg_trial=1">背向候选</a><a style="color:#fff;display:inline-block;padding:14px" href="?story=original&leg_trial=0">基准角色</a></aside><script>if(new URLSearchParams(location.search).has("ui_trial"))document.getElementById("qa-art-switch").hidden=true</script></body>')}
 }]})
})
