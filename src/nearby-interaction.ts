type Point={x:number;y:number}

/** Select only from the current, already revealed projection. Never invent a target. */
export function nearestInteraction<T extends {position:Point}>(entities:readonly T[],position:Point,radius:number):T|undefined{
 let nearest:T|undefined,distance=radius
 for(const entity of entities){const d=Math.hypot(entity.position.x-position.x,entity.position.y-position.y);if(d<=distance&&(!nearest||d<distance)){nearest=entity;distance=d}}
 return nearest
}

export function isInteractionShortcut(e:Pick<KeyboardEvent,'key'|'repeat'|'isComposing'|'defaultPrevented'|'ctrlKey'|'altKey'|'metaKey'>,editing:boolean){
 return !editing&&!e.repeat&&!e.isComposing&&!e.defaultPrevented&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.key.toLowerCase()==='e'
}

/** Keep a nearby focus through small movement, while respecting the authority's strict radius. */
export function stableInteraction<T extends {id:string;position:Point}>(entities:readonly T[],position:Point,radius:number,previousId?:string,preferredId?:string):T|undefined {
 const candidates=entities.map(entity=>({entity,distance:Math.hypot(entity.position.x-position.x,entity.position.y-position.y)})).filter(item=>item.distance<radius)
 candidates.sort((a,b)=>a.distance-b.distance)
 const preferred=candidates.find(item=>item.entity.id===preferredId)
 if(preferred)return preferred.entity
 const nearest=candidates[0],previous=candidates.find(item=>item.entity.id===previousId)
 if(previous&&nearest&&previous.distance-nearest.distance<8)return previous.entity
 return nearest?.entity
}
