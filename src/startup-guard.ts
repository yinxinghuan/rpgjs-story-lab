/** Bounds a single startup attempt. A late runtime must be disposed instead of
 * becoming interactive after failure/unmount; retry remains an explicit reload. */
export function createStartupGuard(onFailure:(code:string)=>void,timeoutMs=90000){
 let pending=true
 const settle=()=>{if(!pending)return false;pending=false;clearTimeout(timer);return true}
 const timer=setTimeout(()=>{if(settle())onFailure('STARTUP_TIMEOUT')},timeoutMs)
 return {
  pending:()=>pending,
  fail:(code:string)=>{if(settle())onFailure(code)},
  cancel:()=>{settle()},
  acceptWhenReady:async<T extends {destroy:()=>void}>(runtime:T,ready:()=>Promise<unknown>)=>{
   if(!pending){runtime.destroy();return false}
   try{await ready()}catch(error){runtime.destroy();if(settle())onFailure(error instanceof Error?error.message:'STARTUP_FAILED');return false}
   if(settle())return true
   runtime.destroy();return false
  },
  accept:<T extends {destroy:()=>void}>(runtime:T)=>{if(settle())return true;runtime.destroy();return false},
 }
}
