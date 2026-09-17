/** Keyboard ownership: editor/control/modal keys must never steer the world. */
export function acceptsWorldKey(event: Pick<KeyboardEvent,'key'|'defaultPrevented'|'isComposing'|'metaKey'|'ctrlKey'|'altKey'>, blocked: boolean, target: Pick<Element,'closest'> | null) {
 if(blocked||event.defaultPrevented||event.isComposing||event.metaKey||event.ctrlKey||event.altKey)return false
 if(target?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],dialog[open]'))return false
 return ['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(event.key.toLowerCase())
}
