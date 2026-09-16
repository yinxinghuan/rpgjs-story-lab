type Api=(path:string,body?:unknown)=>Promise<any>
/** Resume only an existing, unfinished job. POST without retry retains its ID;
 * the server lease decides when work may resume after a lost worker. */
export async function readExpansionJob(api:Api,path:string,pending:'queued'|'preparing',active=()=>true){
 const result=await api(path)
 if(active()&&result.job?.state===pending)return api(path,{})
 return result
}
