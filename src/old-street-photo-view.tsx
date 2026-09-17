import {OldStreetPuzzleHints} from './old-street-puzzle-hints'
import React,{useEffect,useRef,useState} from 'react'
import {oldStreetPhotoPuzzle as basePuzzle} from './old-street-photo-puzzle'
export function OldStreetPhotoView({locale,busy,submit,close,feedback,photograph,reviewOnly=false}:{locale:'zh'|'en';busy:boolean;reviewOnly?:boolean;feedback:string;submit:(proof:unknown)=>void;close:()=>void;photograph?:{image:string;version:string}}){
 const puzzle=photograph?{...basePuzzle,...photograph}:basePuzzle
 const [selected,setSelected]=useState<string>(''),[rotation,setRotation]=useState(0),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false)
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 const dialog=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close()},[])
 const dismiss=()=>{if(busy)return;dialog.current?.close();close()}
 const piece=puzzle.pieces.find(p=>p.id===selected)
 const style=(side:string,mirrored=false,angle=0)=>({backgroundImage:`url("${puzzle.image}")`,backgroundPosition:side==='right'?'right center':'left center',transform:`rotate(${angle}deg) scaleX(${mirrored?-1:1})`,filter:photograph?'grayscale(1)':undefined})
 return <dialog ref={dialog} className="os-map os-photo" aria-label={t(reviewOnly?'旧街照片':'照片比对',reviewOnly?'Old street photograph':'Compare photographs')} onCancel={e=>{e.preventDefault();dismiss()}}>
  <header><h2>{t(reviewOnly?'旧街照片':'接上这张旧照',reviewOnly?'Old street photograph':'Complete the old photograph')}</h2><button disabled={busy} onClick={dismiss}>{t('收起','Close')}</button></header><div className="os-photo__content">{!reviewOnly&&<p>{photograph?t('沿着路面和屋檐，找到能接上的另一半。','Match the road and roof lines across the two halves.'):t('找到能接上窗沿和晾衣绳的另一半。','Find the half whose window sill and clothesline continue the picture.')}</p>}
  <img src={puzzle.image} alt="" hidden onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}/>
  {failed?<p role="alert">{t('照片暂未载入，请关闭后重试。','The photograph could not load. Close and try again.')}</p>:<>
   {!loaded&&<p role="status">{t('正在展开照片……','Unfolding the photographs…')}</p>}
   {reviewOnly?<img className="os-photo__print" src={puzzle.image} alt={t('已拼合的旧街照片','The completed street photograph')} draggable={false}/>:<>
   <div className="os-photo__joined"><div style={style('left')}/><div style={piece?style(piece.side,piece.mirrored,rotation):{}}/></div>
   <div className="os-photo__pieces">{puzzle.pieces.map((p,i)=><button key={p.id} aria-pressed={selected===p.id} aria-label={t(`候选 ${i+1}`,`Piece ${i+1}`)} onClick={()=>{setSelected(p.id);setRotation(0)}} disabled={busy||!loaded}><span style={style(p.side,p.mirrored)}/></button>)}</div></>}
  </>}
  {loaded&&!failed&&!photograph&&!reviewOnly&&<OldStreetPuzzleHints locale={locale} kind="photo" disabled={busy}/>}
  {feedback && <p role="status">{feedback}</p>}
  </div>
  {!failed&&!reviewOnly&&<div className="os-photo__controls">
   <button disabled={!piece||busy||!loaded} onClick={()=>setRotation(r=>r===0?180:0)}>{t('转半圈','Rotate half a turn')}</button>
   <button disabled={!piece||busy||!loaded} onClick={()=>submit({version:puzzle.version,piece:selected,rotation})}>{t('试着拼合','Try matching')}</button>
  </div>}
 </dialog>
}
