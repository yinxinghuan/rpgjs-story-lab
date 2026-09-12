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
