type Point={x:number;y:number}
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v))
/** Presentation only: world positions and authority collision stay in map units. */
export function oldStreetCamera(view:{width:number;height:number},feet:Point,overview=false){
 const scale=overview?Math.min(view.width/384,view.height/576):Math.max(Math.min(view.width/280,1.8),view.height/576)
 const width=384*scale,height=576*scale
 // Reserve a stable HUD band; opening or expanding a panel must never pan the map.
 const actionHeight=Math.min(view.height*.32,244)
 const top=overview?0:68,bottom=overview?view.height:Math.max(top+80,view.height-actionHeight-100)
 const x=width<=view.width?(view.width-width)/2:clamp(view.width/2-(feet.x+8)*scale,view.width-width,0)
 // Aim above the controls, but constrain against the full viewport. Using the
 // action band as the map edge exposes a large empty strip near south doors.
 const y=overview?(view.height-height)/2:clamp(top+(bottom-top)*.55-(feet.y+26)*scale,view.height-height,0)
 return {width,height,x,y,scale}
}
