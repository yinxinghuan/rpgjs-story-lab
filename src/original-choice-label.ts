/** Only split the authored junction label; the submitted action remains intact. */
export function originalChoiceLabel(choice:{id:string;label:string}){
 if(!choice.id.startsWith('junction-'))return {title:choice.label}
 const zh=/^选择「(.+)」；代价：(.+)$/.exec(choice.label),en=/^Choose “(.+)” — Cost: (.+)$/.exec(choice.label),match=zh??en
 if(!match)return {title:choice.label}
 return {title:match[1],cost:(zh?'代价：':'Cost: ')+match[2]}
}
