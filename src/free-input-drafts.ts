// UI drafts only, never an action journal or story writer. Scope is the existing
// deployment adapter plus authority session/scene/target supplied by the parent.
export function readFreeInputDrafts(storage:Pick<Storage,'getItem'>):Record<string,string>{
 try{const value=JSON.parse(storage.getItem('oldstreet-free-input-drafts')??'{}');return Object.fromEntries(Object.entries(value??{}).filter(([key,text])=>key.length<250&&typeof text==='string'&&text.length<=500)) as Record<string,string>}catch{return {}}
}
export function saveFreeInputDrafts(storage:Pick<Storage,'setItem'>,drafts:Record<string,string>){storage.setItem('oldstreet-free-input-drafts',JSON.stringify(drafts))}
