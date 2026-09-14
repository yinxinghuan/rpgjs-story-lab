import React,{useState} from 'react'
import {oldStreetPhotoPuzzle as puzzle} from './old-street-photo-puzzle'
export function OldStreetPhotoView({locale,busy,submit,close,feedback}:{locale:'zh'|'en';busy:boolean;feedback:string;submit:(proof:unknown)=>void;close:()=>void}){
 const [selected,setSelected]=useState<string>(''),[rotation,setRotation]=useState(0),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false)
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 const piece=puzzle.pieces.find(p=>p.id===selected)
 const style=(side:string,mirrored=false,angle=0)=>({backgroundImage:`url("${puzzle.image}")`,backgroundPosition:side==='right'?'right center':'left center',transform:`rotate(${angle}deg) scaleX(${mirrored?-1:1})`})
 return <div className="os-modal" role="dialog" aria-label={t('照片比对','Compare photographs')}><section className="os-photo">
  <h2>{t('接上这张旧照','Complete the old photograph')}</h2><p>{t('找到能接上窗沿和晾衣绳的另一半。','Find the half whose window sill and clothesline continue the picture.')}</p>
  <img src={puzzle.image} alt="" hidden onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}/>
  {failed?<p>{t('照片暂未载入，请关闭后重试。','The photograph could not load. Close and try again.')}</p>:<>
   <div className="os-photo__joined"><div style={style('left')}/><div style={piece?style(piece.side,piece.mirrored,rotation):{}}/></div>
   <div className="os-photo__pieces">{puzzle.pieces.map((p,i)=><button key={p.id} aria-pressed={selected===p.id} aria-label={t(`候选 ${i+1}`,`Piece ${i+1}`)} onClick={()=>{setSelected(p.id);setRotation(0)}} disabled={busy||!loaded}><span style={style(p.side,p.mirrored)}/></button>)}</div>
   <button disabled={!piece||busy||!loaded} onClick={()=>setRotation(r=>r===0?180:0)}>{t('转半圈','Rotate half a turn')}</button>
   <button disabled={!piece||busy||!loaded} onClick={()=>submit({version:puzzle.version,piece:selected,rotation})}>{t('试着拼合','Try matching')}</button>
  </>}
  {feedback && <p role="status">{feedback}</p>}
  <button disabled={busy} onClick={close}>{t('先收起来','Put away')}</button>
 </section></div>
}
