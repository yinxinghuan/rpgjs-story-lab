/** Conservative veto, not a general intent classifier. These forms explicitly
 * do not authorize committing a model-selected action in this game. */
export function actionIntentIssues(input:string):string[]{
 const text=input.trim()
 if(/[?？]|(?:是否|能否|可否|能不能|可不可以|为什么|怎么|怎样|如何|吗|么[。！!]?$)|^(?:can|could|would|should|may|do|does|is|are|what|why|how)\b/i.test(text))return ['ACTION_REQUIRES_COMMITMENT']
 if(/(?:不要|别(?:给|替|帮|拿|开|关|动|装|去)|不想|不用|暂不|先不|不需要|不会|不能)|\b(?:not|never|don['’]t|won['’]t|can['’]t|cannot)\b/i.test(text))return ['NEGATED_ACTION']
 if(/(?:以后|待会|过会|稍后|明天|将来|打算|计划|如果|也许|或者|还是)|\b(?:later|tomorrow|eventually|maybe|perhaps|if|plan to|or)\b/i.test(text))return ['DEFERRED_OR_AMBIGUOUS_ACTION']
 return []
}
