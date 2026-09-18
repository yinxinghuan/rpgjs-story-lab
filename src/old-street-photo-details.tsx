import {useEffect,useState} from 'react'
import type {StorySave} from './vendor/original-train/types'
import {oldStreetPhotoPuzzle} from './old-street-photo-puzzle'

/** Read-only: looking again never awards clues, places an item or solves a puzzle. */
export function OldStreetPhotoDetails({id,save,photoImage}:{id:string;save:StorySave;photoImage?:string}){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 const print=id==='darkroom-print',matched=save.facts['photos-matched']===true
 const image=print?photoImage:matched?oldStreetPhotoPuzzle.image:undefined
 const [failed,setFailed]=useState(false)
 useEffect(()=>setFailed(false),[image])
 const discovery=print?save.facts['darkroom-photo-discovery']:matched?t('窗沿和晾衣绳接上后，是洗衣店的旧店面。','The window sill and clothesline form an old view of the laundry.'):undefined
 return <details className="os-journal__photo-details">
  <summary>{t('查看照片','View photograph')}<svg className="os-journal__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></summary>
  {image&&!failed?<img key={image} src={image} alt={t(print?'本次旅程的旧街照片':'拼合后的洗衣店旧照',print?'The street photograph from this journey':'The matched old laundry photograph')} draggable={false} onError={()=>setFailed(true)}/>:<p role="status">{t(!print&&!matched?'照片还没拼合。到照相馆的放大台查看。':'照片图片暂未载入，物品和已发现的线索仍然保留。',!print&&!matched?'The photograph has not been matched. Examine it at the studio viewing table.':'The image is currently unavailable. Your photograph and discovered clues are still saved.')}</p>}
  {failed&&<button type="button" onClick={()=>setFailed(false)}>{t('重新加载图片','Reload image')}</button>}
  {typeof discovery==='string'&&<p>{discovery}</p>}
  <p>{print?t(save.facts['archive-published']===true?'可带到修表铺，放在公共记录册旁；之后也可以取回。':'可带到修表铺的公共记录册旁。先写入查清的经过，再放置照片；之后也可以取回。',save.facts['archive-published']===true?'Bring it to the watch shop and leave it beside the public record book. You can take it back later.':'Bring it to the public record book in the watch shop. First copy your findings into the book, then place the photograph. You can take it back later.'):t('拼合后交还摄影师，询问可留下哪张照片，再到修表铺记录册收录。','After matching the photos, return them to the photographer and ask which one may be shared. Then record it in the watch shop book.')}</p>
 </details>
}
