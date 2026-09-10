import React from 'react'
import type {Locale, StorySave} from './story'
import {departureActions,departureLabels} from './departure'
import {receptionActions,receptionLabels} from './reception'
export function ReceptionActions({save,target,locale,disabled,onAction}:{save:StorySave;target:string;locale:Locale;disabled:boolean;onAction:(id:string)=>void}){
 const actions=[...receptionActions(save,target),...departureActions(save,target)]
 if(!actions.length)return null
 return <div className="cl-contact" data-reception-actions={target}>{actions.map(id=><button key={id} disabled={disabled} onClick={()=>onAction(id)}>{(receptionLabels[id]??departureLabels[id])[locale==='zh'?0:1]}</button>)}</div>
}
