import type {Preparation} from './old-street-preparations'
export function OldStreetPreparationsView({rows,locale}:{rows:Preparation[];locale:'zh'|'en'}){
 if(!rows.length)return null
 const t=(z:string,e:string)=>locale==='zh'?z:e
 return <details className="os-preparations"><summary>{t('正在准备的内容','Preparations')} · {rows.length}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></summary><ul>{rows.map(row=><li key={row.id}><strong>{row.place} · {row.title}</strong><p>{row.state==='waiting'?t('正在准备，可以先继续探索。','In progress. You can keep exploring.'):row.state==='ready'?t('已准备好。','Ready.'):row.state==='failed'?t('准备中断了。回到原处可以重试。','Preparation stopped. Return to try again.'):t('暂时查不到进度。回到原处可以重新连接。','Progress is unavailable. Return to reconnect.')}{' '}{row.returnTo}</p></li>)}</ul></details>
}
