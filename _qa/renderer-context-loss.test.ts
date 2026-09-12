import {test} from 'node:test'
import assert from 'node:assert/strict'
import {watchRendererContextLoss} from '../src/renderer-context-loss'
import {rendererFailure,rendererNeedsPageReload} from '../src/renderer-transition'

test('canvas loss latches once, leaves native event handling intact and requires reload',()=>{
 class Canvas extends EventTarget {nodeName='CANVAS'}
 const canvas=new Canvas();let notices=0
 const guard=watchRendererContextLoss(canvas,()=>notices++)
 const event=new Event('webglcontextlost',{cancelable:true})
 canvas.dispatchEvent(event);canvas.dispatchEvent(new Event('webglcontextlost'))
 assert.equal(guard.failed(),true);assert.equal(notices,1)
 assert.equal(event.defaultPrevented,false)
 assert.equal(rendererFailure(Error('RENDERER_CONTEXT_LOST')),'RENDERER_CONTEXT_LOST')
 assert.equal(rendererNeedsPageReload('RENDERER_CONTEXT_LOST'),true)
 canvas.dispatchEvent(new Event('webglcontextrestored'))
 assert.equal(guard.failed(),true)
 guard.dispose()
})

test('unrelated host events and disposed listeners cannot fail a renderer',()=>{
 class Host extends EventTarget {nodeName='DIV'}
 const host=new Host();let notices=0
 const guard=watchRendererContextLoss(host,()=>notices++)
 host.dispatchEvent(new Event('webglcontextlost'))
 assert.equal(guard.failed(),false)
 guard.dispose();host.nodeName='CANVAS';host.dispatchEvent(new Event('webglcontextlost'))
 assert.equal(notices,0)
})
