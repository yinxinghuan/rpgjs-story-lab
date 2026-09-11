import {defineConfig,mergeConfig} from 'vite'
import main from '../vite.config'
// Only this separate QA build can omit a completed map notification. Ordinary
// builds contain neither this query nor the one-shot fault marker.
export default defineConfig(async env=>mergeConfig(typeof main==='function'?await main(env):await main,{
 build:{outDir:'/private/tmp/rpgjs-renderer-recovery-qa',emptyOutDir:true},
 plugins:[{name:'qa-renderer-acknowledgement-loss',enforce:'pre' as const,transform(code:string,id:string){
  if(!id.endsWith('/src/rpg-renderer.ts'))return
  const marker='if(sceneIds.includes(id)){loadedScene=id;'
  if(!code.includes(marker))throw Error('QA_RENDERER_FAULT_ANCHOR_CHANGED')
  return code.replace(marker,`if(sceneIds.includes(id)){
   const qaQuery=new URLSearchParams(location.search),qaKey='qa-renderer-loaded-dropped'+(['carriage','preview'].includes(qaQuery.get('qa_drop_loaded')??'')?'-'+qaQuery.get('qa_drop_loaded'):'');
   if(qaQuery.has('qa_drop_loaded')&&!window.alteruSessionStorage.getItem(qaKey)){
    window.alteruSessionStorage.setItem(qaKey,'1');host.dataset.rendererFault='completed-hook-deliberately-dropped';return
   }
   loadedScene=id;`)
 }}]
}))
