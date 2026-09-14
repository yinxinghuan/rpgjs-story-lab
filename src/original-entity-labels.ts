/** Names describe existing interaction points, never their first available choice. */
const names:Record<string,readonly [string,string]>={
 starter:['启动机','Starter'],brakes:['制动检修点','Brake service point'],
 'fuel-shed':['燃料棚','Fuel shed'],'departure-control':['道岔控制台','Route controls'],
 'river-bridge':['河谷桥','Valley bridge'],'river-fuel-locker':['燃料柜','Fuel locker'],'river-return-track':['回程轨道','Return track'],
 'tunnel-fan':['排烟风机','Ventilation fan'],'tunnel-carriage-aisle':['车厢通道','Carriage aisle'],'tunnel-cargo':['货物堆','Cargo'],
 'tunnel-reserve':['燃料储备','Fuel reserve'],'tunnel-exit':['隧道出口','Tunnel exit'],
 'yard-gate':['货场栅门','Yard gate'],'yard-pump':['货场油泵','Yard fuel pump'],'yard-exit':['货场出站口','Yard exit'],
 'pine-signal':['林线信号机','Forest signal'],'pine-rescue-car':['救援车厢','Rescue carriage'],'pine-reserve':['燃料储备','Fuel reserve'],'pine-exit':['林线出口','Forest line exit'],
 'pass-grade-marker':['坡度标','Grade marker'],'pass-carriage-post':['车厢值守处','Carriage watch post'],'pass-brake-control':['制动控制台','Brake controls'],
 'pass-reserve':['燃料储备','Fuel reserve'],'pass-exit':['山口出站口','Pass exit'],
 'town-platform-board':['站台告示牌','Platform board'],'town-generator':['小镇发电机','Town generator'],'town-carriage-register':['车厢名册','Carriage register'],
 'town-supply-point':['补给点','Supply point'],'town-exit':['小镇出站口','Town exit'],
 'bridge-near-bank':['近岸检修台','Near-bank platform'],'bridge-passenger-order':['乘客集合处','Passenger assembly'],
 'bridge-crossing-control':['过桥控制台','Bridge crossing controls'],'bridge-reserve':['燃料储备','Fuel reserve'],
 'junction-route-table':['枢纽调度台','Junction dispatch table'],
}
export function originalEntityLabel(id:string,locale:'zh'|'en'):string|undefined{
 const pair=names[id]??(/^train-at-[a-z-]+-switch$/.test(id)?['总道岔开关','Master switch']:undefined)
 return pair?.[locale==='zh'?0:1]
}
