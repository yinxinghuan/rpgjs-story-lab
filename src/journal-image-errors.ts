// Controlled service codes only; never display arbitrary upstream messages or URLs.
const messages:Record<string,[string,string]>={
 IMAGE_INVALID:['返回的图片没有通过格式或来源检查。','The returned image did not pass format or source checks.'],
 INVALID_RESPONSE:['制作服务返回的图片信息不完整或不匹配。','The service returned incomplete or mismatched image information.'],
 REFERENCE_UNAVAILABLE:['制作服务暂时无法读取场景参考图。','The service could not read the scene reference image.'],
 PROVIDER_REJECTED:['制作服务未接受这次场景请求。','The service did not accept this scene request.'],
 PROVIDER_TASK_LOST:['制作服务已确认原任务丢失。','The service confirmed that the original task was lost.'],
 NOT_FOUND:['制作服务找不到原任务。','The service could not find the original task.'],
 INVALID_REQUEST:['这次制作请求未通过服务检查。','The generation request did not pass the service checks.'],
 ORIGIN_NOT_ALLOWED:['画页服务连接配置暂不可用。','The illustration service connection is not configured correctly.'],
 RATE_LIMITED:['制作次数暂时受限，请等待后恢复。','Generation is temporarily limited. Wait before recovering.'],
 QUEUE_BUSY:['制作队列繁忙，请等待后恢复。','The generation queue is busy. Wait before recovering.'],
}
export function journalImageError(code:string|undefined,locale:'zh'|'en'){
 return messages[code??'']?.[locale==='zh'?0:1]??(locale==='zh'?'制作结果尚未确认。':'The generation result has not been confirmed.')
}
