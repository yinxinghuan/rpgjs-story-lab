const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function deploymentScope(sourceId:string,hostname:string,pathname:string){
 if(hostname==='game.aiwaves.tech'){
  const segment=pathname.split('/').filter(Boolean)[0]??''
  if(!UUID.test(segment))throw new Error('INVALID_DEPLOYMENT_SCOPE')
  return segment.toLowerCase()
 }
 return sourceId
}
