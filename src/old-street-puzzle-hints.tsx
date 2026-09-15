import {useState} from 'react'
/** Optional help reveals one short clue at a time; no story or puzzle submission. */
export function OldStreetPuzzleHints({locale,kind,disabled}:{locale:'zh'|'en';kind:'clock'|'photo';disabled:boolean}){
 const [level,setLevel]=useState(0),zh=locale==='zh'
 const hints=kind==='clock'?[
  ['留意钟底的小金属牌，木纹不是刻记。','Look for a small metal plate beneath the clock, rather than marks in the wood.'],
  ['看看右下方；牌上的两个轮廓是成对的。','Look at the lower right. The two outlines on the plate form a pair.'],
  ['放大右下方的牌子，辨认那对燕子，再选择对应答案。','Magnify the lower-right plate, identify the two swallows, then choose that answer.'],
 ]:[
  ['先看两半照片接缝处，试着让窗沿接成一条线。','Start at the seam and try to make the window sill form a continuous line.'],
  ['窗沿接上后，再看晾衣绳的方向；镜像的一片会左右颠倒。','Then check the direction of the clothesline. A mirrored piece reverses left and right.'],
  ['试试中间那一片，保持刚选中时的方向，不用转半圈。','Try the middle piece in its original orientation, without rotating it.'],
 ]
 return <aside className="os-puzzle-hints" aria-label={zh?'可选提示':'Optional hints'}>
  {level>0&&<p role="status">{hints[level-1][zh?0:1]}</p>}
  {level<hints.length&&<button type="button" disabled={disabled} onClick={()=>setLevel(n=>Math.min(n+1,hints.length))}>{zh?(level?'再具体一点':'给一点提示'):(level?'A more specific hint':'Give me a hint')}</button>}
 </aside>
}
