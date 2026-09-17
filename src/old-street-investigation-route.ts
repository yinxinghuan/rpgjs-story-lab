import type {ArchiveContent} from './old-street-archive'
export const investigationRoutes=['on-site-v1','studio-loan-v1','laundry-loan-v1'] as const
export type InvestigationRoute=typeof investigationRoutes[number]
export function isInvestigationRoute(value:unknown):value is InvestigationRoute{return investigationRoutes.includes(value as InvestigationRoute)}
/** Stable journey-local scheduling, not a random roll on each model retry.
 * The model receives only the plan, never the player/session identity. */
export function chooseInvestigationRoute(journeyId:string):InvestigationRoute{
 let hash=2166136261
 for(const char of journeyId)hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0
 return investigationRoutes[hash%investigationRoutes.length]
}
export function investigationRoutePlan(route:InvestigationRoute){
 if(!isInvestigationRoute(route))throw Error('CAMPAIGN_ROUTE_INVALID')
 return {ledgerSite:route==='studio-loan-v1'?'photo':route==='laundry-loan-v1'?'laundry':'archive',...(route==='on-site-v1'?{}:{denseSource:'index' as const})} as const
}
export function assertInvestigationRoute(content:ArchiveContent,route:InvestigationRoute){
 const plan=investigationRoutePlan(route)
 if((content.ledgerSite??'archive')!==plan.ledgerSite||plan.denseSource&&content.denseSource!==plan.denseSource)throw Error('CAMPAIGN_ROUTE_MISMATCH: preserve the supplied explorationPlan ledgerSite and denseSource. Do not choose another physical route.')
}
