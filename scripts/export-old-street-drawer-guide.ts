import {writeFileSync} from 'node:fs'
import {Resvg} from '@resvg/resvg-js'
const frames=[0,1,2].map(i=>{
 const boxX=i===0?216:54,boxY=i===0?420:365
 return `<g transform="translate(${i*512},0)">
 <path d="M146 358H176V490H146Z M336 358H366V490H336Z" fill="#65462d" stroke="#302b22" stroke-width="6"/>
 <rect x="136" y="192" width="240" height="164" fill="#b99260" stroke="#302b22" stroke-width="6"/>
 <rect x="136" y="356" width="240" height="36" fill="#795230" stroke="#302b22" stroke-width="6"/>
 ${i===0?'<rect x="169" y="361" width="174" height="27" fill="#a27748" stroke="#302b22" stroke-width="4"/><rect x="238" y="370" width="36" height="6" fill="#d9b363"/>':'<rect x="165" y="368" width="182" height="69" fill="#60462e" stroke="#302b22" stroke-width="5"/><rect x="165" y="437" width="182" height="22" fill="#a27748" stroke="#302b22" stroke-width="5"/><rect x="238" y="443" width="36" height="6" fill="#d9b363"/><rect x="186" y="380" width="43" height="42" fill="#e3d4b5" transform="rotate(-5 207 401)"/>'}
 ${i===1?'<circle cx="281" cy="391" r="18" fill="#b9c6bd" stroke="#352f24" stroke-width="6"/><path d="M290 407L305 427" stroke="#352f24" stroke-width="9"/>':''}
 <g transform="translate(${boxX},${boxY})"><rect width="84" height="52" fill="#a58655" stroke="#4e4029" stroke-width="5"/><rect x="7" y="7" width="70" height="32" fill="#54432d"/><rect y="52" width="84" height="22" fill="#8b6b42" stroke="#4e4029" stroke-width="5"/></g>
 </g>`}).join('')
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="768"><rect width="1536" height="768" fill="#ff00ff"/>${frames}</svg>`
writeFileSync('public/assets/oldstreet/drawer-state-guide.svg',svg)
writeFileSync('public/assets/oldstreet/drawer-state-guide.png',new Resvg(svg).render().asPng())
