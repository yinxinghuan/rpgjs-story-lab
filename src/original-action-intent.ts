import {actionIntentIssues} from './action-intent'
export function originalIsAuthoredAction(input:string,labels:readonly string[]){
 const text=input.trim().toLowerCase()
 return labels.some(label=>[label,label.replace(/\s*[（(][^()（）]*[）)]\s*$/,'')].some(value=>value.trim().toLowerCase()===text))
}
/** Veto only. It cannot infer which action the player meant. */
export function originalActionIntentIssues(input:string,authoredLabels:readonly string[]=[]){
 // Exact authored choices can describe a single coordinated action with “and”.
 // Only trusted cartridge labels qualify; caller input is never added here.
 if(originalIsAuthoredAction(input,authoredLabels))return []
 const issues=actionIntentIssues(input)
 if(/(?:别|不要|不必|不准|禁止)/.test(input))issues.push('NEGATED_ACTION')
 if(/(?:然后|接着|同时|并且)|\b(?:and then|then|also|and)\b/i.test(input))issues.push('COMPOUND_ACTION')
 if(/(?:刚才|刚刚|已经|曾经)|\b(?:already|previously|yesterday)\b/i.test(input))issues.push('REPORTED_PAST_ACTION')
 return [...new Set(issues)]
}
