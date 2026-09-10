export type JournalImage={
 version:1;state:'preparing'|'failed'|'active';requestId:string;attempt:number;
 taskId?:string;lease?:string;leaseUntil:number;nextAt:number;recoverable:boolean;
 plan:{version:1;scene:'walkway';artVersion:string;sourceVersion:number;
  request:{sessionId:string;mode:'edit';prompt:string;referenceUrls:[string];size:{width:768;height:1024}};
  referenceSha256:string};
 asset?:{url:string;sha256:string;bytes:number;width:768;height:1024};
 error?:string;
}
