import type {StorySave} from './vendor/original-train/types'
export const photoDisplayed=(save:Pick<StorySave,'facts'>)=>save.facts['darkroom-photo-exhibited']===true
export function photoDisplayLabel(displayed:boolean,locale:'zh'|'en'){
 return locale==='zh'?(displayed?'取回记录册旁的照片':'把照片留在公共记录册旁'):(displayed?'Take back the displayed photograph':'Leave the photograph by the public record')
}
export function photoDisplayDescription(save:Pick<StorySave,'facts'|'locale'>){
 const zh=save.locale==='zh'
 return photoDisplayed(save)?(zh?'照片留在修表铺的公共记录册旁，不在行囊里。离开前可以取回；回家时也可以转述发现。':'Your photograph is beside the public record in the watch shop, not in your bag. Take it back before leaving, or describe it to your family.'):(zh?'把这张照片留给后来的人，行囊里就不再带着它；离开前仍可取回。密封信不会公开。':'Leave this photograph for later visitors and remove it from your bag. You can take it back before leaving. Your sealed letter stays private.')
}
