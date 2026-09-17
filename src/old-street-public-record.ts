import type {OldStreetHead} from './old-street-head'

/** Public summary and private possession are separate choices. */
export function publicRecordAction(recorded:boolean,locale:'zh'|'en'){
 return locale==='zh'?(recorded?'从记录册撤下摘要':'把查清的经过写入记录册'):(recorded?'Remove the public summary':'Copy the findings into the record book')
}
export function publicRecordKnowledge(h:OldStreetHead){
 if(!h.campaign?.archive?.order)return []
 if(h.save.facts['archive-published']===false)return [{id:'learned:public-archive',text:h.save.locale==='zh'?'玩家已从修表铺公共记录册撤下调查摘要。它目前不再公开；不能声称已经忘掉或修改历史。':'The player removed their investigation summary from the watch shop public record book. It is no longer public; this does not erase or rewrite history.'}]
 if(h.save.facts['archive-published']!==true)return []
 return [{id:'learned:public-archive',text:h.save.locale==='zh'
  ?`玩家已把以下摘要抄入修表铺的公共记录册：${h.campaign.archive.content.discovery} 这是玩家留下的记录，不代表你亲历该事件或已经读过册页。未公开密封家书，原件去向另计。`
  :`The player copied this summary into the watch shop's public record book: ${h.campaign.archive.content.discovery} This is a record left by the player, not proof that you witnessed the event or already read the book. The sealed family letter was not published; possession of the original papers is separate.`}]
}
