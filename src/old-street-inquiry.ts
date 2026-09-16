export type InquiryFocus={first:string;second:string}
export function readInquiryFocus(raw:unknown):InquiryFocus{
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>k!=='first'&&k!=='second'))throw Error('CAMPAIGN_INQUIRY_INVALID')
 const r=raw as Record<string,unknown>
 const event=(value:unknown)=>{if(typeof value!=='string'||!value.trim()||value.length>70||/[<>\u0000-\u001f]/.test(value))throw Error('CAMPAIGN_INQUIRY_INVALID');return value.trim()}
 const first=event(r.first),second=event(r.second)
 if(first.normalize('NFKC').toLowerCase()===second.normalize('NFKC').toLowerCase())throw Error('CAMPAIGN_INQUIRY_INVALID')
 return {first,second}
}
/** The field names are identities, never an assertion of chronological order. */
export function inquiryQuestion(focus:InquiryFocus,locale:'zh'|'en'){
 return locale==='zh'?`「${focus.first}」和「${focus.second}」，哪件先发生？`:`Which came first: “${focus.first}” or “${focus.second}”?`
}
export function inquiryConclusion(focus:InquiryFocus,firstBeforeSecond:boolean,locale:'zh'|'en'){
 const before=firstBeforeSecond?focus.first:focus.second,after=firstBeforeSecond?focus.second:focus.first
 return locale==='zh'?`两处记录对上了：「${before}」发生在「${after}」之前。`:`The two sources agree: “${before}” happened before “${after}”.`
}
