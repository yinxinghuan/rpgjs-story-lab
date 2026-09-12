/** A UI timeout stops waiting, not an engine transfer already in flight. */
export const RENDERER_TRANSITION_TIMEOUT_MS = 30000
const failures=new Set(['MAP_TRANSFER_TIMEOUT','MAP_TRANSFER_REJECTED','MAP_TRANSFER_BUSY','MAP_RUNTIME_DISPOSED','RENDERER_CONTEXT_LOST'])
export function rendererFailure(error:unknown){return error instanceof Error&&failures.has(error.message)?error.message:'RENDERER_RESTORE'}
// This RPG-JS beta has page-global providers. Reconnecting Story Session cannot
// recreate a renderer whose initial load never acknowledged completion.
export function rendererNeedsPageReload(code:string){return ['MAP_TRANSFER_TIMEOUT','MAP_RUNTIME_DISPOSED','RPG_RENDERER_ALREADY_CREATED','RENDERER_CONTEXT_LOST'].includes(code)}
type Port<S, P> = {
  changeMap: (scene: S, position: P) => Promise<boolean>
  teleport: (position: P) => Promise<unknown>
  commit: (scene: S, position: P) => void
}
export class RendererTransition<S, P> {
  private current: S
  private joined: S | null = null
  private loaded: S | null = null
  private waiters = new Set<() => void>()
  private flight?: {scene:S; promise:Promise<void>}
  private disposed = false
  constructor(initial:S, private port:Port<S,P>, private timeoutMs=RENDERER_TRANSITION_TIMEOUT_MS) { this.current=initial }
  joinedScene(scene:S) { this.joined=scene; this.notify() }
  loadedScene(scene:S) { this.loaded=scene; this.notify() }
  status(){return {scene:this.current,joined:this.joined,loaded:this.loaded,pendingScene:this.flight?.scene??null,disposed:this.disposed}}
  private notify() { for (const check of [...this.waiters]) check() }
  private ready(scene:S):Promise<void> {
    return new Promise((resolve,reject)=>{
      const check=()=>{
        if(this.disposed){this.waiters.delete(check);reject(Error('MAP_RUNTIME_DISPOSED'))}
        else if(this.joined===scene&&this.loaded===scene){this.waiters.delete(check);resolve()}
      }
      this.waiters.add(check);check()
    })
  }
  restore(scene:S,position:P):Promise<void> {
    if(this.disposed)return Promise.reject(Error('MAP_RUNTIME_DISPOSED'))
    if(this.flight&&this.flight.scene!==scene)return Promise.reject(Error('MAP_TRANSFER_BUSY'))
    if(!this.flight){
      const promise=this.perform(scene,position)
      const flight={scene,promise};this.flight=flight
      // Keep the actual engine operation alive after any caller's deadline.
      void promise.then(()=>{if(this.flight===flight)this.flight=undefined},()=>{if(this.flight===flight)this.flight=undefined})
    }
    const promise=this.flight.promise
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('MAP_TRANSFER_TIMEOUT')),this.timeoutMs)
      void promise.then(()=>{clearTimeout(timer);resolve()},error=>{clearTimeout(timer);reject(error)})
    })
  }
  private async perform(scene:S,position:P){
    await this.ready(this.current)
    if(this.current!==scene){
      if(!await this.port.changeMap(scene,position))throw Error('MAP_TRANSFER_REJECTED')
      if(this.disposed)throw Error('MAP_RUNTIME_DISPOSED')
      // The engine has changed rooms even if its renderer is still loading.
      this.current=scene
      await this.ready(scene)
    }else await this.port.teleport(position)
    if(this.disposed)throw Error('MAP_RUNTIME_DISPOSED')
    this.port.commit(scene,position)
  }
  dispose(){this.disposed=true;this.notify()}
}
