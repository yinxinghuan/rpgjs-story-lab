import type {StorySave,StoryBlock} from './vendor/original-train/types'
import {oldStreetConversationHistory} from './old-street-conversation'
import './old-street-conversation-history.css'

export function OldStreetConversationHistory({save,speakerId,current}:{save:StorySave;speakerId:string;current:StoryBlock[]}){
 const speaker=save.characters.find(c=>c.id===speakerId)
 if(!speaker)return null
 const rows=oldStreetConversationHistory(save,speakerId,current),zh=save.locale==='zh'
 return <details className="os-conversation-history">
  <summary>{zh?'之前的交谈':'Earlier conversations'}{rows.length>0?` · ${rows.length}`:''}</summary>
  {rows.length?<ol>{rows.map(row=><li key={row.id}><p><strong>{zh?'你':'You'}</strong>{row.input}</p><p><strong>{speaker.name}</strong>{row.reply}</p></li>)}</ol>:<p>{zh?'还没有更早的交谈记录。':'No earlier conversations yet.'}</p>}
 </details>
}
