import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import {OldStreetExpansionView} from '../src/old-street-expansion-view'
import '../src/old-street-dev.css'
function Review(){
 const [requested,setRequested]=useState(false),[receipt,setReceipt]=useState('')
 const locale=new URLSearchParams(location.search).get('locale')==='en'?'en':'zh'
 return <main className="os-dev" style={{width:'100%',maxWidth:390,margin:'auto',padding:16}}><section style={{width:'100%'}}>
 <OldStreetExpansionView locale={locale} sessionId="synthetic-ui-00001" archiveTitle="The footbridge repairs and its reopening" requested={requested} disabled={false} api={async()=>({job:{state:'candidate'}})} submit={async(text,follow)=>{setReceipt(JSON.stringify({text,followArchive:follow}));setRequested(true)}} activate={async()=>setReceipt('Activated synthetic room')}/>
 <output aria-label="Synthetic receipt">{receipt}</output>
 </section></main>
}
createRoot(document.getElementById('root')!).render(<Review/> )
