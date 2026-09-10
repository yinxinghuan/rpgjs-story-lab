import type { Locale, StoryCartridge, StoryDangerDirector, StoryDomainRules, StoryEndingDirector, StoryImageDirector } from '../types'

const coverImage = new URL('../img/worlds/last-train-to-dawn.png', import.meta.url).href
const entryImage = new URL('../img/worlds/last-train-to-dawn-entry-v2.png', import.meta.url).href
const audioThemeUrl = new URL('../audio/assets/theme.mp3', import.meta.url).href
const audioAmbienceUrl = new URL('../audio/assets/ambience.mp3', import.meta.url).href
const audioFeatureUrl = new URL('../audio/assets/feature.mp3', import.meta.url).href

const demoZh = [
  {
    match: ['检修启动机', '启动机', '先修'],
    imageSubject: 'player' as const,
    imagePrompt: 'inside the cramped driver cab and interior service vestibule of the stalled last diesel railcar, SUBJECT A kneels beside an open starter relay cabinet while young mechanic Ada lights the machinery from a separate position, anxious passengers visible through the open carriage connection, rain only glimpsed through windows, decisive repair action, the carriage interior fills the frame, grounded near-present railway disaster, 4:5 portrait, no readable text, no UI',
    content: `你拆开启动机护盖。积水没有进到主线圈，但一枚烧黑的继电器卡死在触点上。阿达把应急灯压低，让你看清还能抢救的铜片。
[skill_check: skill="应急抢修" dc="9" rolls="11" modifier="2" total="13" result="success"]
[widget: condition, add: 5]
[party_change: character_id="ada-mechanic" character="阿达" change="add" role="机修学徒" detail="确认你没有拿列车和乘客冒险，主动接下机务岗位" lore="她在洪水前刚通过最后一次实操考试，却一直认为自己还不够资格" vitality="82" stress="42" skills="机修: 5|判断异响: 3"]
[fact: id="starter-repaired" value="true"]
发动机第一次点火失败，第二次终于咬住。油量表只停在六成多；西侧燃料棚的门半开着，候车厅里也开始有人争抢座位。
[state: value="补足启程条件并稳定第一批乘客"]
[choices: "趁发动机预热搜查西侧燃料棚"|"让阿达检查制动和转向架"|"回候车厅说明路线与上车规则"]`
  },
  {
    match: ['燃料棚', '搜查', '柴油'],
    imageSubject: 'player' as const,
    imagePrompt: 'SUBJECT A searches a half-flooded station fuel shed beside the last diesel railcar, discovering two sealed red fuel cans and a hand pump while distant figures approach through rain, clear salvage action, grounded railway disaster, 4:5 portrait, no readable text, no UI',
    content: `燃料棚里大半桶柴油已经混进雨水。你在高架货架上找到两只铅封完整的油桶和一台手摇泵；远处雨幕里，另有三个人正沿围栏向这里靠近。
[inventory: action="add" item_id="sealed-diesel" item="铅封柴油桶" count="2" rarity="common" detail="两只未进水的二十升铁路备用柴油桶" effect="可在停车时转化为燃料；搬运时占用一名行动者" lore="死站每月更换一次的应急库存" metrics="容量: 40 L|状态: 铅封完整" image_prompt="two sealed red railway diesel cans and a manual transfer pump on wet concrete, object only, no people, no readable text, square"]
[widget: fuel, add: 14]
[fact: id="fuel-shed-salvaged" value="true"]
那三个人没有武器，只推着一名发烧的孩子。他们愿意用一台便携电台换三个上车名额。
[choices: "同意交换并让他们一起上车"|"先检查电台和孩子的病情"|"拒绝交换，但送他们一桶燃料"]`
  },
  {
    match: ['候车厅', '上车规则', '说明路线', '稳定乘客'],
    imageSubject: 'player' as const,
    imagePrompt: 'inside the worn passenger carriage of the last diesel railcar, SUBJECT A stands in the aisle explaining a route plan to anxious seated and standing passengers, mechanic Ada and Doctor Ren shown as separate people, warm ceiling lamps and rain-streaked windows enclosing the group, grounded human tension, the carriage interior fills the frame, 4:5 portrait, no readable signs, no UI',
    content: `你没有承诺每个人都能原样抵达，只说清三条规则：危险会先警告；物资和岗位公开登记；任何人都可以在下一站离开。
[widget: morale, add: 12]
[character_update: character_id="ren-medic" character="任医生" role="乡镇急诊医生" detail="带着一只不完整的急救箱，主动提出负责伤员登记" lore="他错过了撤离车，因为留下来给最后两名病人缝合" vitality="76" stress="36" skills="急救: 5|安抚: 3"]
[fact: id="passenger-rules-public" value="true"]
任医生指出，一名老人需要在两小时内补充氧气。最近的诊所在河谷支线，安全的采石场线则有燃料仓，林线更短但无线电里没有回声。
[choices: "走河谷支线寻找氧气"|"走采石场线优先补充燃料"|"派人先侦察没有回声的林线"]`
  },
  {
    match: ['阿达检查', '制动', '转向架'],
    imageSubject: 'others' as const,
    imagePrompt: 'inside the rear maintenance vestibule of the stalled last diesel railcar, young mechanic Ada separately inspects a cracked brake hose through an open floor service hatch while SUBJECT A watches from the carriage aisle, work lamp, wet steel floor and passengers beyond the interior door, grounded documentary railway scene, the carriage interior fills the frame, 4:5 portrait, no readable text, no UI',
    content: `阿达钻进转向架下方，敲过第四根制动管时停住。软管外皮已经裂开，但钢丝层还没断；现在更换会耽误启程，带伤运行则可能在长下坡失压。
[character_update: character_id="ada-mechanic" character="阿达" role="机修学徒" detail="发现二号转向架制动软管裂纹，等待你决定立即换管还是低速运行" lore="她会记住玩家是否尊重专业警告" vitality="82" stress="38" skills="机修: 5|判断异响: 3"]
[fact: id="brake-hose-warning" value="true"]
[choices: "立即换管，消耗备件但提高车况"|"记录裂纹，限制速度后先启程"|"让阿达和另一名志愿者并行换管"]`
  },
  {
    match: ['河谷支线', '寻找氧气'],
    imageSubject: 'environment' as const,
    imagePrompt: 'inside the moving driver cab of the last diesel railcar entering a flooded river valley branch before dawn, camera behind the worn controls and two crew silhouettes, weak signal lamps, clinic roof and damaged bridge visible only through the broad rain-streaked windscreen, the cab interior and human decision dominate the frame, cinematic grounded railway disaster journey drama, 4:5 portrait, no readable text, no UI',
    content: `道岔扳到河谷线，末班车在雨里重新移动。十七分钟后，前灯照出半截被水冲空的桥台；诊所就在对岸，但桥上只剩一条完整钢轨。
[map_update: new_location="河谷断桥" connected_to="死站" detail="通往诊所的短桥被洪水冲空半侧，只剩一条主轨与检修梁" lore="桥还能承受多少重量，没有任何人能从外观判断" facts="诊所在对岸|桥台继续被冲刷"]
[fact: id="route-family" value="valley"]
[clock: value="第 1 夜 · 02:41"]
[encounter: phase="warning" kind="河谷断桥" severity="2"]
[state: value="在桥台完全失稳前决定如何过河"]
[choices: "低速压上主轨，用全车重量试桥"|"停车卸下乘客，徒步去诊所取氧气"|"用总调度钥匙打开下游维修岔线"]`
  },
  {
    match: ['采石场线', '补充燃料'],
    imageSubject: 'environment' as const,
    imagePrompt: 'inside the dim driver cab and front passenger vestibule of the last diesel railcar entering an abandoned quarry freight yard before dawn, crew and passengers react as fuel tanks behind chained gates and armed silhouettes appear through rain-streaked windows, the train interior fills most of the frame and the yard remains a view outside, grounded cinematic railway survival, 4:5 portrait, no readable text, no UI',
    content: `采石场线比旧图多出一道临时闸门。燃料罐还在，装卸台上却有人点亮三盏手电；他们用扩音器要求列车留下药品，才允许泵油。
[map_update: new_location="灰石货场" connected_to="死站" detail="有完整燃料罐的废弃采石场货场，被一支临时守卫队控制" lore="守卫说他们保护附近三座避难点，也有人说他们扣住所有过路车辆" facts="燃料充足|守卫控制泵站"]
[fact: id="route-family" value="quarry"]
[encounter: phase="warning" kind="货场燃料封锁" severity="2"]
[choices: "把列车停在掩体后准备夺取泵站"|"派任医生谈药品和燃料的交换比例"|"从旧装煤线绕到储罐背面"]`
  },
  {
    match: ['林线', '侦察', '没有回声'],
    imageSubject: 'player' as const,
    imagePrompt: 'SUBJECT A scouts ahead of a stopped diesel railcar on an overgrown forest branch at night, flashlight revealing fresh wheel marks and a manually reversed signal lever, train crew remains separate behind, tense grounded railway mystery, 4:5 portrait, no readable text, no UI',
    content: `林线并非没人经过。湿枕木上有不到一小时前留下的车轮压痕，信号杆被人手动扳到“安全”，却没有接通信号电路。前方弯道后传来缓慢倒退的钢轮声。
[map_update: new_location="黑松林线" connected_to="死站" detail="被植被吞没的短线，信号被人为伪装成安全" lore="这条线曾服务一座关闭的木材厂" facts="有新鲜轮痕|前方车辆正在倒退"]
[fact: id="route-family" value="forest"]
[encounter: phase="warning" kind="失控货车" severity="3"]
[choices: "跑回列车组织紧急倒车"|"攀上信号架确认货车距离"|"使用总调度钥匙切入废木场侧线"]`
  },
  {
    match: ['总调度钥匙', '维修岔线', '侧线'],
    imageSubject: 'player' as const,
    imagePrompt: 'SUBJECT A uses a heavy brass master switch key inside a rain-lashed manual switch house, one brass tooth snapping as the rail points move, train visible separately outside, decisive mechanical action, grounded railway disaster, 4:5 portrait, no readable text, no UI',
    content: `总调度钥匙插进手摇机。你压下去时，一枚黄铜齿在锁芯里折断，封死的维修线却真的从水和杂草中接回主轨。
[skill_check: skill="手动道岔" dc="13" rolls="14" modifier="1" total="15" result="success"]
[fact: id="switch-key-uses" value="1"]
[fact: id="hidden-route-open" value="true"]
[widget: fuel, remove: 8]
[encounter: phase="resolution" kind="线路封锁" severity="2" outcome="success"]
列车绕过正面危险，但维修线尽头停着一节旧救援车。车里有氧气瓶、钢索和一个仍在拍门的人。
[choices: "先救出车里的人"|"先把氧气和钢索转移上车"|"检查救援车为何被反锁"]`
  },
  {
    match: ['低速压', '试桥', '全车重量', '夺取泵站', '紧急倒车'],
    imageSubject: 'player' as const,
    imagePrompt: 'inside the shaking driver cab of the last diesel railcar, SUBJECT A leads the primary high-risk railway action at the controls while Ada and another companion remain visually separate, rain and structural danger visible through the windscreen, passengers bracing in the connected carriage behind, one clear decisive movement, the cab interior fills the frame, grounded cinematic disaster, 4:5 portrait, no readable text, no UI',
    content: `你选择用最直接的方法抢在危险完成之前行动。列车与钢轨同时发出过载的呻吟，阿达在无线电里逐秒报出震动变化。
[skill_check: skill="正面处置" dc="14" rolls="10" modifier="2" total="12" result="costly-success"]
[widget: condition, remove: 12]
[widget: morale, add: 4]
[fact: id="first-danger-method" value="direct"]
[encounter: phase="resolution" kind="第一段线路危机" severity="3" outcome="costly-success"]
列车通过了最危险的一段，但二号转向架的裂纹扩大。下一站的灯亮着；站台上有人挥动一块白布。
[state: value="决定是否停车接触亮灯站台"]
[choices: "停车，让阿达先检查转向架"|"保持警戒，派两人接近站台"|"不停车，用电台询问对方身份"]`
  },
  {
    match: ['任医生谈', '交换比例', '电台询问', '同意交换'],
    imageSubject: 'others' as const,
    imagePrompt: 'viewed from inside the open side doorway of the last diesel railcar, rural doctor Ren negotiates separately with wary station survivors at the threshold, medicine case and fuel hose between groups, anxious passengers and warm carriage fittings frame the foreground, SUBJECT A not depicted as the speaking actor, grounded humane disaster scene, 4:5 portrait, no readable text, no UI',
    content: `任医生先把药箱打开，让对方看清哪些药能给、哪些药一旦交出就没人能替代。对面的领头人沉默很久，最后把燃料泵和避难点名单一起交出来。
[skill_check: skill="有底线的交涉" dc="12" rolls="13" modifier="2" total="15" result="success"]
[widget: fuel, add: 16]
[widget: morale, add: 8]
[fact: id="first-danger-method" value="negotiate"]
[fact: id="aid-network-known" value="true"]
[encounter: phase="resolution" kind="第一段线路危机" severity="2" outcome="success"]
你们没有获得全部燃料，却多了一条能在后续站点互相证明身份的救援网络。
[choices: "把避难点加入路线图"|"邀请领头人的电工随车同行"|"留下药品并立刻赶往下一站"]`
  },
  {
    match: ['绕到', '确认货车距离', '徒步去诊所', '派两人接近'],
    imageSubject: 'player' as const,
    imagePrompt: 'SUBJECT A scouts a narrow maintenance route beside floodwater and dark rails while companions remain separately positioned, discovering a safe bypass marker and salvage cache, tense but controlled railway expedition, 4:5 portrait, no readable text, no UI',
    content: `你没有让整列车替一次判断下注。检修道很窄，却能看见危险真正的受力点；一只被遗忘的工具箱还压着旧绕行图。
[skill_check: skill="侦察绕行" dc="12" rolls="16" modifier="1" total="17" result="success"]
[inventory: action="add" item_id="bridge-kit" item="桥检工具箱" count="1" rarity="rare" detail="钢索夹、探伤锤和两枚短路信号器" effect="可降低一次桥梁、隧道或轨道危险的严重度；使用后消耗" lore="旧铁路救援队留在检修道的标准装备" metrics="可用次数: 1|重量: 12 kg" image_prompt="single battered railway bridge inspection kit with cable clamps, sounding hammer and two blank signal lamps, object only, no people, no readable text, square"]
[fact: id="first-danger-method" value="scout"]
[encounter: phase="resolution" kind="第一段线路危机" severity="2" outcome="success"]
你带回的不只是路线：工具箱夹层里还有下一段山口线的手绘高程，足以避开一处已经被水淹没的坡道。
[choices: "采用高程图规划山口路线"|"先回列车救治伤员"|"把工具箱交给阿达保管"]`
  },
  {
    match: ['检查转向架', '亮灯站台', '加入路线图', '邀请', '救出车里的人', '转移氧气'],
    imageSubject: 'others' as const,
    imagePrompt: 'inside the warm worn passenger carriage of the last train stopped at a small platform before dawn, mechanic Ada closes a service panel while newly rescued passengers settle into seats and Doctor Ren tends one patient, rain and the small platform visible only through windows, chapter milestone, humane grounded cinematic railway journey drama, the carriage interior fills the frame, 4:5 portrait, no readable text, no UI',
    content: `列车在亮灯站台停稳。阿达把裂管换下，任医生接过氧气瓶，新上车的人则把下一段山口的真实路况一条条说清。
[widget: condition, add: 10]
[widget: morale, add: 6]
[fact: id="chapter-dead-station-complete" value="true"]
[clock: value="第 1 夜 · 03:26"]
[state: value="第一章完成：列车已经成为一支真正的队伍"]
[session_end: reason="死站启程章节完成；可继续进入河谷、采石场或林线后的完整旅程"]
车轮重新转动时，没人再问你是不是正式列车长。他们只问：下一站，我们准备救谁？
[choices: "继续驶向山口与下一章"|"整理列车岗位和背包"|"回看已经留下的路线承诺"]`
  },
]

function build(locale: Locale): StoryCartridge {
  const zh = locale === 'zh'
  const s = (cn: string, en: string) => zh ? cn : en
  const c = (cn: [string, string, string], en: [string, string, string]): [string, string, string] => zh ? cn : en
  const imageDirector: StoryImageDirector = {
    maxQuietTurns: 1, softCooldownTurns: 0,
    guaranteedTriggers: ['new-location', 'rare-item', 'party-change', 'chapter-checkpoint', 'relationship-change', 'objective-change', 'skill-outcome'],
    softTriggers: [],
    perspective: { ordinary: 'balanced', importantDialogue: 'first-person', newLocation: 'observer' },
  }
  const dangerDirector: StoryDangerDirector = {
    minSafeTurns: 1, maxSafeTurns: 3, cooldownTurns: 2,
    escalationStats: ['fuel', 'condition', 'morale'],
    threatPalette: zh
      ? ['武装燃料盗贼从无灯检修台登车', '洪水在列车已经上桥后掏空桥台', '隧道火灾迫使乘客决定放弃哪些货物', '恐慌车厢试图夺取路线控制', '失控货车从山坡倒退逼近', '受伤兽群追随温暖发动机进入车站']
      : ['armed fuel thieves board from an unlit maintenance platform', 'floodwater undermines a bridge after the train commits', 'a tunnel fire forces a cargo sacrifice', 'a panicked carriage attempts to seize route control', 'runaway freight cars roll downhill', 'wounded animals follow the warm engine into a station'],
    methods: zh ? ['用车载探灯确认威胁来向', '把乘客撤到前车并锁住连接门', '用维修工具加固眼前故障点'] : ['Use the train lamp to locate the threat', 'Move passengers forward and lock the gangway door', 'Use repair tools on the immediate failure point'],
    legacyMethods: zh ? [['正面守线或冒险抢修', '交涉、交换或保护他人', '侦察绕路并消耗装备']] : [['hold the line or repair under pressure', 'negotiate, trade or protect', 'scout a detour and spend equipment']],
    physicalCombat: 'occasional',
    resolution: { skill: s('线路生存', 'Rail Survival'), modifier: 1, dcBySeverity: [7, 10, 13, 16, 19], criticalDcBonus: 5, fallbackCosts: [{ statId: 'condition', operation: 'remove', amount: 12 }] },
  }
  const domainRules: StoryDomainRules = {
    rules: [
      {
        id: 'repair-starter', intent: 'repair-starter',
        match: zh ? ['检修启动机', '修启动机', '抢修启动机', '启动机'] : ['repair the starter', 'repair starter', 'fix the starter', 'starter'],
        requirements: [
          { type: 'map', nodeId: 'dead-station', reason: s('启动机只能在北岬死站停车时检修', 'The starter can only be repaired while stopped at North Cape Dead Station') },
          { type: 'fact', id: 'starter-repaired', notEquals: true, reason: s('启动机已经修复，重复拆装不会再次提高车况', 'The starter is already repaired; reopening it cannot improve Condition again') },
        ],
        effects: [
          { type: 'stat', id: 'condition', delta: 5 },
          { type: 'fact', id: 'starter-repaired', value: true },
          { type: 'party', change: 'add', characterId: 'ada-mechanic' },
        ],
        successText: s('烧黑的继电器被重新接通，发动机稳定点火；阿达正式接下机务岗位。', 'The burned relay reconnects, the engine catches, and Ada formally takes the engineering post.'),
        successChoices: zh ? ['搜查西侧燃料棚', '检查制动与转向架', '说明上车规则'] : ['Search the west fuel shed', 'Inspect the brakes and bogies', 'Set the boarding rules'],
      },
      {
        id: 'salvage-fuel-shed', intent: 'salvage-fuel-shed',
        match: zh ? ['搜查燃料棚', '搜索燃料棚', '去燃料棚', '找柴油'] : ['search the fuel shed', 'search fuel shed', 'look for diesel'],
        requirements: [
          { type: 'map', nodeId: 'dead-station', reason: s('燃料棚只在北岬死站可达', 'The fuel shed is only reachable at North Cape Dead Station') },
          { type: 'fact', id: 'fuel-shed-salvaged', notEquals: true, reason: s('燃料棚已经搜尽，剩余油桶都已进水', 'The fuel shed has already been exhausted; the remaining drums are contaminated') },
        ],
        effects: [
          {
            type: 'inventory', action: 'add', itemId: 'sealed-diesel', count: 2,
            item: {
              id: 'sealed-diesel', label: s('铅封柴油桶', 'Sealed Diesel Cans'), count: 0, rarity: 'common',
              detail: s('两只未进水的二十升铁路备用柴油桶', 'Two intact twenty-liter railway reserve cans'),
              effect: s('可在停车时转化为燃料；搬运时占用一名行动者', 'Convert to Fuel while stopped; moving them occupies one crew member'),
              lore: s('死站每月更换一次的应急库存', 'Emergency stock rotated monthly before the station died'),
              metrics: [{ id: 'capacity', label: s('容量', 'Capacity'), value: '40 L' }, { id: 'seal', label: s('状态', 'State'), value: s('铅封完整', 'Seals intact') }],
              imagePrompt: 'two sealed red railway diesel cans and a manual transfer pump on wet concrete, object only, no people, no readable text, square',
            },
          },
          { type: 'stat', id: 'fuel', delta: 14 },
          { type: 'fact', id: 'fuel-shed-salvaged', value: true },
        ],
        successText: s('高架上只剩两只铅封完整的备用油桶；它们被登记入物资舱并接入油路。', 'Only two sealed reserve cans remain on the high rack; they enter the supply log and fuel line.'),
        successChoices: zh ? ['接纳带孩子靠近的三个人', '先检查孩子与便携电台', '返回列车检查制动'] : ['Take aboard the three people with the child', 'Inspect the child and portable radio', 'Return to inspect the brakes'],
      },
      {
        id: 'inspect-brakes', intent: 'inspect-brakes',
        match: zh ? ['检查制动', '检查转向架', '检查软管', '阿达检查'] : ['inspect the brakes', 'inspect brakes', 'inspect the bogie', 'check the brake hose'],
        requirements: [
          { type: 'map', nodeId: 'dead-station', reason: s('完整制动检查需要列车停在死站检修位', 'A full brake inspection requires the dead-station service position') },
          { type: 'fact', id: 'brake-hose-warning', notEquals: true, reason: s('裂纹已经完成记录，下一步应决定是否换管', 'The crack is already recorded; the next decision is whether to replace the hose') },
        ],
        effects: [{ type: 'fact', id: 'brake-hose-warning', value: true }],
        successText: s('阿达确认二号转向架的制动软管外皮开裂，带伤运行会在长下坡失压。', 'Ada confirms a cracked brake hose on the second bogie; running it risks pressure loss on the descent.'),
        successChoices: zh ? ['消耗备件立即换管', '记录裂纹后低速启程', '先修启动机再决定路线'] : ['Spend the spare hose and replace it now', 'Record the crack and depart at low speed', 'Repair the starter before choosing a route'],
      },
      {
        id: 'replace-brake-hose', intent: 'replace-brake-hose',
        match: zh ? ['更换制动软管', '立即换管', '换掉裂管', '用制动软管'] : ['replace the brake hose', 'replace brake hose', 'replace the cracked hose', 'use the spare hose'],
        requirements: [
          { type: 'map', nodeId: 'dead-station', reason: s('换管必须在死站停车检修位完成', 'The hose must be replaced while stopped at the dead-station service position') },
          { type: 'fact', id: 'brake-hose-warning', equals: true, reason: s('还没有确认裂纹位置，不能盲目拆卸制动管', 'The crack has not been located; the brake line cannot be opened blindly') },
          { type: 'item', id: 'spare-hose', minCount: 1, reason: s('物资舱里已经没有适配的制动软管', 'No compatible spare brake hose remains in the supply hold') },
        ],
        effects: [
          { type: 'inventory', action: 'remove', itemId: 'spare-hose', count: 1 },
          { type: 'stat', id: 'condition', delta: 10 },
          { type: 'fact', id: 'brake-hose-warning', value: false },
          { type: 'fact', id: 'brake-hose-replaced', value: true },
        ],
        successText: s('裂管和接头被整体换下，制动压力重新稳定；备用软管已经消耗。', 'The cracked hose and coupling come out as one piece; brake pressure stabilizes and the spare is consumed.'),
        successChoices: zh ? ['修好启动机准备启程', '搜查燃料棚', '向乘客说明上车规则'] : ['Repair the starter and prepare to depart', 'Search the fuel shed', 'Set the boarding rules'],
      },
      ...([
        ['commit-valley-route', 'commit-valley-route', zh ? ['走河谷支线', '选择河谷线', '去河谷找氧气'] : ['take the river valley branch', 'choose the valley line', 'go to the valley for oxygen'], 'valley', 'river-valley', -6],
        ['commit-quarry-route', 'commit-quarry-route', zh ? ['走采石场线', '选择采石场线', '去灰石货场'] : ['take the quarry line', 'choose the quarry line', 'go to graystone yard'], 'quarry', 'graystone-yard', -5],
        ['commit-forest-route', 'commit-forest-route', zh ? ['侦察没有回声的林线', '走黑松林线', '选择林线'] : ['scout the silent forest line', 'take the black pine line', 'choose the forest line'], 'forest', 'pine-line', -4],
      ] as const).map(([id, intent, match, route, nodeId, fuelDelta]) => ({
        id, intent, match: [...match],
        requirements: [
          { type: 'map' as const, nodeId: 'dead-station', reason: s('首发路线只能从北岬死站承诺', 'The first route can only be committed from North Cape Dead Station') },
          { type: 'fact' as const, id: 'starter-repaired', equals: true, reason: s('启动机尚未修复，列车不能进入任何支线', 'The starter is not repaired; the train cannot enter a branch line') },
          { type: 'fact' as const, id: 'route-family', equals: 'unset', reason: s('首发路线已经承诺，不能在同一章节静默改线', 'The first route is already committed and cannot be silently changed in this chapter') },
        ],
        effects: [
          { type: 'fact' as const, id: 'route-family', value: route },
          { type: 'map' as const, nodeId },
          { type: 'stat' as const, id: 'fuel', delta: fuelDelta },
        ],
        successText: s(`道岔锁入${route === 'valley' ? '河谷' : route === 'quarry' ? '采石场' : '黑松林'}方向，首段行程的燃料成本已经结算。`, `The switch locks toward the ${route} route and the first-leg fuel cost is settled.`),
        successChoices: c(['正面处理前方危险', '组织交涉或救援', '侦察绕路并准备工具'], ['Confront the danger directly', 'Organize negotiation or rescue', 'Scout a detour and prepare equipment']),
        rejectionChoices: c(['和阿达检修启动机', '搜查西侧燃料棚', '检查制动与转向架'], ['Repair the starter with Ada', 'Search the west fuel shed', 'Inspect the brakes and bogies']),
      })),
      {
        id: 'use-master-switch-key', intent: 'use-master-switch-key',
        match: zh ? ['使用总调度钥匙', '用总调度钥匙', '钥匙打开维修岔线', '钥匙切入侧线'] : ['use the master switch key', 'use master switch key', 'key the maintenance siding', 'key into the siding'],
        requirements: [
          { type: 'item', id: 'master-switch-key', minCount: 1, reason: s('总调度钥匙不在物资舱中', 'The Master Switch Key is not in the supply hold') },
          { type: 'fact', id: 'route-family', notEquals: 'unset', reason: s('尚未承诺路线，没有可覆盖的线路封锁', 'No route is committed, so there is no route lock to override') },
          { type: 'fact', id: 'switch-key-uses', max: 2, reason: s('三枚黄铜齿已经全部折断，总调度钥匙不能再覆盖道岔', 'All three brass teeth have sheared; the Master Switch Key cannot override another switch') },
          { type: 'danger', phases: ['warning', 'confrontation'], reason: s('当前线路没有需要覆盖的预警或对峙危险', 'The current route has no warning or confrontation that requires an override') },
        ],
        effects: [
          { type: 'fact-add', id: 'switch-key-uses', delta: 1 },
          { type: 'fact', id: 'hidden-route-open', value: true },
          { type: 'stat', id: 'fuel', delta: -8 },
          { type: 'danger', outcome: 'success' },
        ],
        successText: s('一枚黄铜齿折断，封闭维修线接回主轨；当前线路危险被绕过。', 'One brass tooth shears and the sealed maintenance route reconnects, bypassing the current route danger.'),
        successChoices: c(['先救维修车里的人', '转移氧气与钢索', '检查救援车为何反锁'], ['Free the person in the rescue car', 'Transfer the oxygen and cable', 'Inspect why the rescue car was locked']),
        rejectionChoices: c(['正面处理当前危险', '组织交涉保护乘客', '侦察绕路并保留钥匙'], ['Confront the current danger', 'Negotiate while protecting passengers', 'Scout a detour and preserve the key']),
      },
    ],
    derivedItemMetrics: [{
      itemId: 'master-switch-key', metricId: 'remaining-overrides', label: s('剩余覆盖', 'Overrides'),
      factId: 'switch-key-uses', maximum: 3, mode: 'remaining-from-used',
    }],
  }
  const endingDirector: StoryEndingDirector = {
    startRequirements: [
      { type: 'fact', id: 'chapter-bridge-complete', equals: true },
      { type: 'scene', min: 24 },
    ],
    capabilities: [
      {
        id: 'railway-commons',
        label: s('让列车成为公共铁路', 'Make the train a public railway'),
        meaning: s('把路线、岗位和物资登记交给所有乘客共同监督。', 'Place routes, duties and supplies under shared passenger oversight.'),
        requires: [{ type: 'fact', id: 'passenger-rules-public', equals: true }, { type: 'stat', id: 'morale', min: 50 }],
        mandatoryCosts: [s('你永久放弃对列车的个人最终决定权', 'You permanently surrender sole final authority over the train')],
        incompatibleWith: ['sole-command'],
      },
      {
        id: 'rescue-network',
        label: s('建立沿线救援网络', 'Build a route-wide rescue network'),
        meaning: s('让曾被帮助的站点继续交换人员、药品、燃料和真实路况。', 'Let aided stations continue exchanging people, medicine, fuel and verified route conditions.'),
        requires: [{ type: 'fact', id: 'aid-network-known', equals: true }, { type: 'stat', id: 'morale', min: 40 }],
        mandatoryCosts: [s('列车必须长期为沿线救援预留车厢和燃料', 'The train must permanently reserve carriage space and fuel for route rescues')],
      },
      {
        id: 'keep-moving',
        label: s('继续驶向地图之外', 'Keep moving beyond the map'),
        meaning: s('不在枢纽停下，把列车继续开向仍然失联的北方支线。', 'Do not settle at the junction; continue toward disconnected northern branches.'),
        requires: [{ type: 'fact', id: 'chapter-bridge-complete', equals: true }, { type: 'stat', id: 'fuel', min: 25 }, { type: 'stat', id: 'condition', min: 30 }],
        mandatoryCosts: [s('放弃黎明枢纽现成的安全与固定住处', 'Give up the junction’s immediate safety and permanent homes')],
        incompatibleWith: ['settle-junction'],
      },
      {
        id: 'settle-junction',
        label: s('在黎明枢纽定居', 'Settle at Dawn Junction'),
        meaning: s('把列车停成第一条街，让乘客在车厢周围建立新社区。', 'Park the train as the first street of a new community around its carriages.'),
        requires: [{ type: 'fact', id: 'chapter-bridge-complete', equals: true }],
        mandatoryCosts: [s('列车不再作为一整列自由旅行的车辆', 'The train ceases to be a single free-roaming vehicle')],
        incompatibleWith: ['keep-moving'],
      },
      {
        id: 'sacrifice-train',
        label: s('让列车成为最后一座桥', 'Turn the train into the last bridge'),
        meaning: s('把车体固定在洪水缺口上，换取所有步行者安全抵达。', 'Anchor the train across the flood gap so every person can cross on foot.'),
        requires: [{ type: 'fact', id: 'chapter-bridge-complete', equals: true }, { type: 'stat', id: 'condition', max: 45 }],
        mandatoryCosts: [s('末班车永久失去继续行驶的能力', 'The last train permanently loses the ability to move')],
        incompatibleWith: ['keep-moving'],
      },
      {
        id: 'crew-autonomy',
        label: s('让伙伴各自掌管岗位', 'Give each companion authority over their post'),
        meaning: s('路线、机务、医疗与守卫互相制衡，不再等待一个人的命令。', 'Route, engineering, medicine and defense balance one another instead of waiting for one person.'),
        requires: [{ type: 'character', id: 'ada-mechanic', status: 'companion' }, { type: 'stat', id: 'morale', min: 55 }],
        mandatoryCosts: [s('你不能再越过伙伴的专业否决', 'You can no longer override a companion’s professional veto')],
        incompatibleWith: ['sole-command'],
      },
      {
        id: 'sole-command',
        label: s('保留紧急列车长制度', 'Retain emergency sole command'),
        meaning: s('在下一次灾害来临前保持单一指挥，换取更快但更孤独的决定。', 'Keep one command authority until the next disaster for faster, lonelier decisions.'),
        requires: [{ type: 'fact', id: 'chapter-bridge-complete', equals: true }, { type: 'stat', id: 'condition', min: 20 }],
        mandatoryCosts: [s('乘客保留离开列车并拒绝命令的永久权利', 'Passengers retain the permanent right to leave the train and refuse orders')],
        incompatibleWith: ['railway-commons', 'crew-autonomy'],
      },
      {
        id: 'open-route-archive',
        label: s('公开整条旅程的路线档案', 'Open the complete route archive'),
        meaning: s('把危险、错误、物资与获救者全部公开，后来的列车不再从零开始。', 'Publish dangers, mistakes, supplies and rescues so later trains do not start from zero.'),
        requires: [{ type: 'fact', id: 'chapter-bridge-complete', equals: true }, { type: 'item', id: 'field-radio', minCount: 1 }],
        mandatoryCosts: [s('队伍的错误与冲突也会被永久公开', 'The crew’s mistakes and conflicts also become permanently public')],
      },
    ],
    anchors: [
      {
        id: 'common-line', title: s('共同线路', 'The Common Line'),
        thesis: s('列车抵达的意义，不是有人终于成为主人，而是再也没有人能独占方向。', 'Arrival matters because no one can own everyone’s direction again.'),
        capabilityIds: ['railway-commons', 'rescue-network'],
        irreversibleCosts: [s('个人最终决定权被交还给共同议事', 'Sole final authority returns to a public council')],
        preserved: [s('列车、伙伴和沿线互助网络', 'the train, companions and route-wide aid network')],
        lost: [s('一个人替所有人决定的速度', 'the speed of one person deciding for everyone')],
        unresolved: [s('共同决策在下一场危机里是否仍能维持', 'whether shared decisions survive the next crisis')],
        finaleScenes: [s('列车驶入黎明枢纽。', 'The train enters Dawn Junction.'), s('乘客把岗位表钉在车库外。', 'Passengers post the duty board outside the depot.'), s('第一列返程救援车由不同的人共同签发。', 'The first return rescue run receives many signatures.'), s('你把总调度钥匙放到公共桌面中央。', 'You place the Master Switch Key at the center of the public table.')],
        finalImagePrompt: 'dawn at a restored railway junction, diverse passengers and crew gathered around one public route table beside the weathered diesel train, hopeful grounded realism, no readable text, no UI',
      },
      {
        id: 'endless-rescue', title: s('下一站还有人', 'Someone at the Next Stop'),
        thesis: s('你们没有把抵达当作结束，而是把活下来的路线变成别人的开始。', 'You refuse to treat arrival as an ending and turn a survived route into someone else’s beginning.'),
        capabilityIds: ['keep-moving', 'rescue-network'],
        irreversibleCosts: [s('放弃固定住处并长期预留救援物资', 'Give up a permanent home and reserve supplies for rescue')],
        preserved: [s('会移动的列车与主动同行的伙伴', 'the moving train and companions who choose to continue')],
        lost: [s('枢纽里已经准备好的安稳生活', 'the stable life already waiting at the junction')],
        unresolved: [s('北方失联线路还剩多少人', 'how many people remain on the disconnected northern lines')],
        finaleScenes: [s('车门在枢纽只打开二十分钟。', 'The doors open at the junction for only twenty minutes.'), s('有人下车，也有人搬着药箱上车。', 'Some step off while others board with medical cases.'), s('阿达重新点亮前灯。', 'Ada relights the headlamp.'), s('列车朝地图空白处再次鸣笛。', 'The train whistles toward the blank edge of the map.')],
        finalImagePrompt: 'weathered rescue train departing a dawn railway junction toward unmapped northern hills, crew visible in warm windows, grounded cinematic hope, no readable text, no UI',
      },
      {
        id: 'first-street', title: s('第一条街', 'The First Street'),
        thesis: s('家不是找到的终点，而是这群人决定不再继续逃的时候共同开始的地方。', 'Home begins where this group decides to stop running together.'),
        capabilityIds: ['settle-junction', 'crew-autonomy'],
        irreversibleCosts: [s('列车拆分为诊所、厨房、教室与住宅', 'The train is divided into clinic, kitchen, classroom and homes')],
        preserved: [s('伙伴关系、乘客家庭和车厢里的共同记忆', 'companion bonds, passenger families and shared carriage memories')],
        lost: [s('整列车再次远行的可能', 'the possibility of the whole train traveling again')],
        unresolved: [s('新社区将如何接纳下一批到来者', 'how the new community will receive later arrivals')],
        finaleScenes: [s('列车停在枢纽最亮的月台。', 'The train stops at the junction’s brightest platform.'), s('任医生把一节车厢改成诊所。', 'Doctor Ren turns one carriage into a clinic.'), s('孩子们在旧路线图背面画新街道。', 'Children draw new streets on the back of the old route map.'), s('第一晚，所有车窗仍亮得像列车随时会出发。', 'On the first night every window glows as if departure were still possible.')],
        finalImagePrompt: 'stationary train transformed into the first warm street of a new dawn community, clinic and kitchen lights in carriages, families outside, grounded realism, no readable text, no UI',
      },
      {
        id: 'the-last-bridge', title: s('最后一座桥', 'The Last Bridge'),
        thesis: s('列车没有抵达终点，但它让所有人越过了原本过不去的地方。', 'The train never reaches the terminus, but it carries everyone across what was otherwise impassable.'),
        capabilityIds: ['sacrifice-train', 'rescue-network'],
        irreversibleCosts: [s('车体固定在洪水缺口，发动机永久停转', 'The train is anchored across the flood gap and its engine stops forever')],
        preserved: [s('全部乘客、伙伴与沿线救援承诺', 'all passengers, companions and route rescue promises')],
        lost: [s('作为车辆的末班车', 'the last train as a moving vehicle')],
        unresolved: [s('谁会在水退后拆下第一段铁轨', 'who will remove the first rail after the water recedes')],
        finaleScenes: [s('最后一节车厢卡进断桥缺口。', 'The last carriage locks into the bridge gap.'), s('钢索收紧，乘客开始步行过车顶。', 'Cables tighten as passengers cross over the roof.'), s('你最后一个关掉发动机。', 'You shut down the engine last.'), s('日出时，列车第一次看起来像一座桥。', 'At sunrise the train looks like a bridge for the first time.')],
        finalImagePrompt: 'weathered diesel train anchored across a flooded bridge gap at sunrise while survivors cross safely over it, grounded heroic realism, no text, no UI',
      },
      {
        id: 'open-ledger', title: s('公开行车簿', 'The Open Route Book'),
        thesis: s('最有价值的遗产不是英雄故事，而是连错误都没有被删去的真实路线。', 'The most valuable legacy is not a heroic story but an honest route that keeps even its mistakes.'),
        capabilityIds: ['open-route-archive', 'railway-commons'],
        irreversibleCosts: [s('所有错误、争执与失败和成功一起公开', 'Every mistake, dispute and failure becomes public beside every success')],
        preserved: [s('完整路线、物资来源与获救者记录', 'the full route, supply provenance and rescue record')],
        lost: [s('队伍可以只讲体面版本的权利', 'the crew’s ability to tell only a flattering version')],
        unresolved: [s('后来的人会如何解释这些记录', 'how later travelers will interpret the archive')],
        finaleScenes: [s('电台把行车簿逐站广播。', 'The radio broadcasts the route book station by station.'), s('阿达读出每一次维修失误。', 'Ada reads every repair mistake aloud.'), s('任医生补上没有被统计的人名。', 'Doctor Ren adds names the counts missed.'), s('下一列车收到的不只是路线，还有代价。', 'The next train receives not just the route but its costs.')],
        finalImagePrompt: 'rail crew broadcasting an open route archive from a dawn station beside the train, maps and radio present but blank with no readable text, grounded realism, no UI',
      },
      {
        id: 'many-hands', title: s('许多双手', 'Many Hands at the Controls'),
        thesis: s('你证明了带队并不等于永远站在最前面，而是知道什么时候把位置交给更合适的人。', 'Leadership means knowing when to hand the controls to the right person.'),
        capabilityIds: ['crew-autonomy', 'open-route-archive'],
        irreversibleCosts: [s('任何岗位都可以依据公开事实否决列车长', 'Any post may overrule the conductor using public evidence')],
        preserved: [s('专业岗位、伙伴关系和可继续行驶的列车', 'crew expertise, companion bonds and a train that can still move')],
        lost: [s('快速但未经质疑的命令', 'fast commands that no one may question')],
        unresolved: [s('下一任列车长会是谁', 'who the next conductor will be')],
        finaleScenes: [s('阿达签下第一张正式机务许可。', 'Ada signs the first formal engineering clearance.'), s('任医生宣布车厢可以接收伤员。', 'Doctor Ren declares the medical carriage ready.'), s('你把驾驶席让给新班组。', 'You yield the cab to the next crew.'), s('列车在许多人的检查声中再次启动。', 'The train starts again under many voices checking one another.')],
        finalImagePrompt: 'multiple distinct crew members sharing responsibility inside and beside a weathered train cab at dawn, collaborative grounded realism, no readable text, no UI',
      },
      {
        id: 'emergency-conductor', title: s('仍然需要列车长', 'A Conductor Is Still Needed'),
        thesis: s('共同体保留了你的指挥权，但也把离开与拒绝写成任何人不能收回的权利。', 'The community retains your command but makes refusal and departure rights no one can revoke.'),
        capabilityIds: ['sole-command', 'open-route-archive'],
        irreversibleCosts: [s('你的每次紧急命令都必须公开记录并接受事后审查', 'Every emergency order must be publicly recorded and reviewed')],
        preserved: [s('危机中的快速指挥与继续运行的列车', 'fast crisis command and a train that keeps running')],
        lost: [s('命令天然正确的幻觉', 'the illusion that command is inherently right')],
        unresolved: [s('下一次灾害结束后制度是否会解除', 'whether the system ends after the next disaster')],
        finaleScenes: [s('乘客投票保留一枚紧急哨。', 'Passengers vote to keep one emergency whistle.'), s('你的命令旁边第一次出现公开异议。', 'Public objections appear beside your orders for the first time.'), s('离开者带走自己的物资与路线副本。', 'Those who leave take their supplies and route copies.'), s('你在黎明里重新戴上列车长臂章。', 'You put on the conductor band again in the dawn light.')],
        finalImagePrompt: 'solitary temporary conductor beside a weathered train at dawn while passengers openly choose to board or depart, grounded morally complex realism, no readable text, no UI',
      },
      {
        id: 'quiet-platform', title: s('安静的月台', 'The Quiet Platform'),
        thesis: s('不是所有胜利都需要列车继续前进；有时让每个人自己选择留下，就是抵达。', 'Not every victory requires the train to keep moving; letting everyone choose to stay can be arrival.'),
        capabilityIds: ['settle-junction', 'open-route-archive'],
        irreversibleCosts: [s('路线的未来交给仍愿意出发的后来者', 'The route’s future passes to later travelers willing to depart')],
        preserved: [s('获救者、完整档案和一个可以生活的枢纽', 'the rescued, the complete archive and a livable junction')],
        lost: [s('所有人必须一起去同一终点的想法', 'the idea that everyone must share one destination')],
        unresolved: [s('哪一天会有人再次发动这列车', 'the day someone starts the train again')],
        finaleScenes: [s('乘客逐个选择自己的站台。', 'Passengers choose their platforms one by one.'), s('行车簿留在公开候车厅。', 'The route book remains in the public waiting hall.'), s('发动机冷却，雨终于停了。', 'The engine cools as the rain finally stops.'), s('清晨的月台第一次没有人催促出发。', 'For the first time no one rushes the morning platform to depart.')],
        finalImagePrompt: 'quiet dawn railway platform after rain, weathered train resting while former passengers build ordinary life around it, contemplative grounded realism, no readable text, no UI',
      },
    ],
    requiredCharacterIds: ['ada-mechanic', 'ren-medic'],
    minRegionalEpilogues: 3,
    maxRepairAttempts: 2,
  }
  return {
    schemaVersion: 1, id: 'last-train-to-dawn', locale,
    coverImage, entryImage,
    copy: {
      title: s('开往黎明的末班车', 'Last Train to Dawn'),
      subtitle: s('最后一列还能移动的乡镇柴油列车', 'The last regional diesel train still moving'),
      promise: s('修好列车、选择铁路支线、带人穿过洪水；每一站都有人值得带上。', 'Repair the train, choose the branch lines, and carry people through the flood—every stop leaves someone worth bringing forward.'),
      enter: s('启动末班车', 'Start the last train'), continue: s('继续行驶', 'Continue the journey'),
      customAction: s('也可以写下你真正想做的事', 'Or write what you truly want to do'),
      itemImagingTitle: s('列车档案正在显影', 'The train archive is developing'),
      itemImagingBody: s('物品的磨损、用途和来历正在被记录。', 'The object’s wear, use and provenance are being recorded.'),
    },
    theme: { outer: '#10191D', surface: '#1B282C', paper: '#EFE8D7', ink: '#172126', muted: '#697276', accent: '#178C72', danger: '#D74935', gold: '#D49B3A', material: 'wayfarer' },
    audioTheme: { material: 'wayfarer', bpm: 62, rootHz: 55, scale: [1, 1.2, 1.333, 1.5, 1.778], levels: { music: 0.15, ambient: 0.23, sfx: 0.045, master: 0.72 }, tension: [{ statId: 'fuel', direction: 'low', weight: 0.25 }, { statId: 'condition', direction: 'low', weight: 0.45 }, { statId: 'morale', direction: 'low', weight: 0.3 }], recorded: { music: { src: audioThemeUrl, gain: .19 }, ambience: { src: audioAmbienceUrl, gain: .3 }, cues: { discovery: { src: audioFeatureUrl, gain: .18, role: 'feature', cooldownMs: 180_000 }, relationship: { src: audioFeatureUrl, gain: .18, role: 'feature', cooldownMs: 180_000 }, summary: { src: audioFeatureUrl, gain: .18, role: 'feature', cooldownMs: 180_000 } } } },
    itemImageDirection: 'railway field inventory photograph on worn cream route paper and dark wet steel, object only, clear scale and wear, no people, no readable text, square',
    sceneImageDirection: 'grounded cinematic near-present railway disaster journey drama aboard one specific weathered two-car REGIONAL DIESEL TRAIN running on rural branch tracks, never a road automobile and never an urban subway. Its recurring home stage is INSIDE the same train: old individual brown vinyl seats, overhead luggage racks, cream enamel wall panels, oxidized steel window frames, a compact connected driver cab, maintenance vestibule, medical corner and warm carriage lamps. When an action can be staged aboard, the camera must remain inside and this recognisable regional-train architecture must fill at least 70% of the frame; routes, bridges, small stations and danger are seen through rain-streaked windows, the windscreen or an open doorway. Exterior shots are reserved for actions that physically require leaving the train, and the next compatible beat returns inside. One legible action, clear actor separation, signal red accents, 4:5 portrait central safe composition, no readable text, no UI',
    sceneImageAvoid: 'road car, automobile, bus, coach bus, urban subway, metro carriage, underground platform, modern commuter metro, camera standing on the tracks, rails as the dominant foreground, exterior train hero shot, repeated departure canopy, generic railway landscape, empty carriage, luxury-train styling, cyberpunk neon, steampunk, readable signs, pseudo-writing, duplicated faces, merged actors',
    transitionAnchor: s('同一节列车车厢里的调度图与岗位表', 'the route map and crew board inside the same train carriage'),
    playerImageAliases: zh ? ['玩家', '你', '临时列车长', '带队者'] : ['player', 'you', 'temporary conductor', 'crew leader'],
    playerImageRole: s('掌握路线决定权的人，视觉身份完全由玩家参考图决定，不强制人类、脸部、性别或制服', 'the person holding route authority, whose complete visual identity comes only from the player reference without assuming a human face, gender or uniform'),
    playerImageExclusions: zh ? ['阿达', '任医生', '乘客', '盗贼', '动物'] : ['Ada', 'Doctor Ren', 'passengers', 'raiders', 'animals'],
    imageDirector,
    mediaDirector: { imageProfile: 'fast-small', imageTarget: { width: 512, height: 640 }, videoEnabled: false, videoDuration: 5, minVideoGapTurns: 8 },
    director: {
      mode: 'guided',
      fixedWorldRules: [
        s('列车、路线、已过站点、损伤、燃料、物品、承诺、伤势和乘客成员不能被静默改写。', 'The train, route, passed stops, damage, fuel, items, promises, injuries and passenger membership cannot be silently rewritten.'),
        s('人物只知道亲眼看见或被告知的事实；伙伴必须用稳定身份持续存在。', 'Characters know only what they witnessed or were told; companions persist by stable identity.'),
        s('尚未在正文中可见登场的人物不能出现在成员面板、目标或选项中；首次登场必须先写外形与身份来源，再允许相关行动。', 'Characters not yet visibly introduced in prose cannot appear in the roster, objective or choices; a debut must show their appearance and identity source before related actions.'),
        s('每次获得、消耗、交换、损坏或遗失物品都必须进入权威背包事务。', 'Every acquisition, consumption, trade, breakage or loss must use an authoritative inventory transaction.'),
      ],
      generationRules: [
        s('可以生成守规则的站点事件、幸存者、传闻、物资、地方派系和短支线。', 'Generate rule-bound station incidents, survivors, rumors, salvage, local factions and short side jobs.'),
        s('每个回合至少改变路线、资源、关系、物品、危险阶段或目标中的一项。', 'Every turn changes at least one route, resource, relationship, item, danger phase or objective fact.'),
        s('失败产生可玩的抢修、分裂、绕路、失去伙伴或找回物资，不删除存档。', 'Failure creates playable repair, split-party, detour, companion-loss or recovery play instead of deleting the save.'),
        s('节奏优先：从玩家行动的直接结果开始，不复述上回合，不用纯气氛、重复调查或再次确认拖延决定。', 'Pace first: begin with the direct consequence of the player action; never recap the prior turn or delay a decision with atmosphere-only beats, repeated investigation or redundant confirmation.'),
        s('每章用 3–5 次有后果的玩家决定完成；每条支线最多占 1–2 次决定。连续两回合若没有新地点、新人物、新物品、新危险或章节事实，下一回合必须强制推进主线。', 'Complete each chapter in 3–5 consequential player decisions; a side job may consume only 1–2 decisions. If two consecutive turns add no new place, person, item, threat or chapter fact, the next turn must force the main quest forward.'),
        s('危险预警只占一个回合；下一回合必须进入对峙，玩家回应后的下一回合必须结算并打开新局面。', 'A danger warning occupies one turn only; the next turn must confront it, and the turn after the player response must resolve it and open a new situation.'),
        s('玩家行动后的第一句必须给出直接结果；正文最多三个短节拍，然后立即停在新的实质选择。禁止用“继续调查、再看看、确认一下”作为没有收益的过渡。', 'The first sentence after an action must give its direct result; use at most three short beats, then stop at a new substantive choice. Never use continue investigating, look again or confirm as payoff-free transitions.'),
        s('新角色首次出现必须按“可见外形或动作—名字或身份来源—当前关系—互动选项”的顺序；隐藏协议命令不算玩家看见。', 'A new character debut must follow visible form or action, name or identity source, current relationship, then interaction choices; hidden protocol commands do not count as visible introduction.'),
        s('中文叙述必须用“列车、车厢、驾驶室、铁路支线”等明确词汇；可能被理解为汽车时禁止只写一个“车”字。', 'Keep the vehicle unambiguous in every scene: it is one rural two-car diesel train on railway branch lines, never a road car, bus, subway or metro.'),
      ],
      choiceIntents: zh ? ['直接行动或工程处理', '交涉、招募、交易或保护', '侦察、绕路、即兴或消耗物品'] : ['direct physical or engineering action', 'negotiate, recruit, trade or protect', 'scout, detour, improvise or spend an item'],
      maxActiveThreads: 2,
      mainQuest: s('在洪水越过终点桥之前抵达黎明枢纽，并决定列车最终属于谁。', 'Reach Dawn Junction before the final bridge floods and decide who the train ultimately belongs to.'),
      chapters: [
        { id: 'dead-station', title: s('死站启程', 'Departure from the Dead Station'), unlock: s('开场', 'Opening'), emotionalPurpose: s('把陌生人变成第一支队伍', 'Turn strangers into a first crew'), beats: [s('启动列车', 'restart the train'), s('补足燃料或秩序', 'secure fuel or order'), s('选第一条支线', 'choose the first branch')], completionFacts: ['chapter-dead-station-complete'] },
        { id: 'river-valley', title: s('河谷支线', 'River Valley Branch'), unlock: s('列车启程', 'train departed'), emotionalPurpose: s('第一次为救人付出路线代价', 'pay the first route cost to save someone'), beats: [s('断桥', 'broken bridge'), s('诊所氧气', 'clinic oxygen'), s('洪水回程', 'flood return')], completionFacts: ['chapter-river-complete'] },
        { id: 'tunnel-fire', title: s('隧道火场', 'Tunnel Fire'), unlock: s('通过第一支线', 'first branch cleared'), emotionalPurpose: s('决定不能全部带走时放弃什么', 'decide what to abandon'), beats: [s('烟雾预警', 'smoke warning'), s('分车厢撤离', 'carriage evacuation'), s('货物取舍', 'cargo sacrifice')], completionFacts: ['chapter-tunnel-complete'] },
        { id: 'salt-yard', title: s('盐湖货场', 'Salt Yard'), unlock: s('离开隧道', 'tunnel cleared'), emotionalPurpose: s('面对物资所有权与暴力', 'face ownership and violence'), beats: [s('燃料谈判', 'fuel negotiation'), s('货场冲突', 'yard conflict'), s('第二次岔路', 'second branch')], completionFacts: ['chapter-yard-complete'] },
        { id: 'mountain-pass', title: s('山口争夺', 'Battle for the Pass'), unlock: s('选定山口线', 'pass route chosen'), emotionalPurpose: s('让伙伴承担真正岗位', 'let companions own real roles'), beats: [s('失控货车', 'runaway freight'), s('岗位分工', 'crew roles'), s('山口决战', 'pass confrontation')], completionFacts: ['chapter-pass-complete'] },
        { id: 'sleeping-town', title: s('沉睡小城', 'Sleeping Town'), unlock: s('越过山口', 'pass crossed'), emotionalPurpose: s('在短暂停靠中看见可能的家', 'see a possible home'), beats: [s('无人街道', 'empty streets'), s('留下或继续', 'stay or continue'), s('最后招募', 'last recruitment')], completionFacts: ['chapter-town-complete'] },
        { id: 'flood-bridge', title: s('洪水桥', 'Flood Bridge'), unlock: s('离开小城', 'town departed'), emotionalPurpose: s('偿还前六章所有选择', 'pay off all prior choices'), beats: [s('桥梁倒计时', 'bridge countdown'), s('分离与重逢', 'separation and reunion'), s('最后钥匙', 'last key')], completionFacts: ['chapter-bridge-complete'] },
        { id: 'dawn-junction', title: s('黎明枢纽', 'Dawn Junction'), unlock: s('通过洪水桥', 'flood bridge crossed'), emotionalPurpose: s('决定列车和队伍的未来', 'decide the train and crew future'), beats: [s('抵达', 'arrival'), s('权力归属', 'ownership'), s('各自去向', 'aftermath')], completionFacts: ['true-ending-ready'] },
      ],
      finaleRule: s('只有抵达黎明枢纽并完成列车归属抉择才是真结局；章节结束均可继续。', 'Only arrival at Dawn Junction plus the ownership decision is a true ending; chapter endings remain resumable.'),
    },
    dangerDirector,
    domainRules,
    endingDirector,
    initialFacts: { 'switch-key-uses': 0, 'rescued-count': 0, 'route-family': 'unset', 'passenger-rules-public': false },
    statDefinitions: [
      { id: 'fuel', label: s('燃料', 'Fuel'), min: 0, max: 100, initial: 68, inverse: true, display: 'bar', warningAt: 28, dangerAt: 8, maxDelta: 20 },
      { id: 'condition', label: s('车况', 'Condition'), min: 0, max: 100, initial: 82, inverse: true, display: 'bar', warningAt: 35, dangerAt: 12, maxDelta: 22 },
      { id: 'morale', label: s('人心', 'Morale'), min: 0, max: 100, initial: 58, inverse: true, display: 'bar', warningAt: 30, dangerAt: 10, maxDelta: 18 },
    ],
    drawerLabels: { party: s('列车成员', 'Train Crew'), map: s('线路图', 'Route Map'), inventory: s('物资舱', 'Supplies'), log: s('行车日志', 'Journey Log') },
    opening: {
      location: s('北岬死站 · 柴油列车车厢', 'North Cape Dead Station · Regional Diesel Train'),
      time: s('第 1 夜 · 02:07', 'Night One · 02:07'),
      objective: s('先让这列乡镇柴油列车重新点火，再决定第一条铁路支线', 'Restart this regional diesel train, then choose its first railway branch'),
      imagePrompt: 'inside the worn passenger carriage and connected driver cab of one stalled weathered two-car REGIONAL DIESEL TRAIN at a rural terminus before dawn, unmistakably a railway train and absolutely not a car, bus, subway or metro. The carriage interior fills the frame: old individual brown vinyl seats, overhead luggage racks, cream enamel panels, oxidized steel window frames, damp ribbed floor and warm ceiling lamps. Forty-seven anxious evacuees wait in readable separate groups. Young apprentice mechanic Ada, clearly a separate person, has just stepped out from an open interior starter panel holding a work lamp. The empty driver seat and dark cab show that no trained leader remains. Floodwater approaching the outdoor railway switch and the dead small-town platform appear only as narrow glimpses through rain-streaked windows. In the foreground SUBJECT A holds a heavy three-tooth brass railway switch key over a blank cream route sheet; SUBJECT A appearance comes only from the supplied reference when used. Grounded humane cinematic railway disaster, 4:5 portrait, central safe composition, absolutely no readable text, no UI, no logo, no exterior train hero view, no camera on tracks',
      blocks: [
        { id: 'ltd0', kind: 'narration', text: s('你只是来北岬站等撤离列车的普通乘客。', 'You came to North Cape Station as an ordinary passenger waiting for evacuation.') },
        { id: 'ltd1', kind: 'event', text: s('暴雨冲断公路。救援列车没来，候车厅却开始坍塌。', 'The flood severed the roads. The rescue train never came; instead, the waiting hall began to collapse.') },
        { id: 'ltd2', kind: 'event', text: s('你拉开侧线列车的门，四十七个人跟着你挤进两节柴油车厢。', 'You pulled open the train on the siding, and forty-seven people followed you into its two diesel carriages.') },
        { id: 'ltd3', kind: 'dialogue', speaker: s('负伤的值班调度员', 'Injured station dispatcher'), tone: s('被抬去临时医务角前，把三齿黄铜钥匙压进你手里', 'pressing a three-tooth brass key into your hand before being carried to the medical corner'), text: s('“列车长去查进水的道岔，还没回来。钥匙不能让你成为列车长——可刚才，他们听了你的。”', '“The conductor went to inspect the flooding switch and has not returned. This key cannot make you a conductor—but those people listened to you.”') },
        { id: 'ltd4', kind: 'dialogue', speaker: s('阿达', 'Ada'), tone: s('一个满手机油的年轻人从驾驶室后的检修口抬起机务灯', 'a young mechanic with oil-darkened hands raising a work lamp from the access panel behind the cab'), text: s('“我叫阿达，机修学徒。这是两节连在一起的柴油列车，烧油，不靠电网。”', '“I’m Ada, an apprentice mechanic. This is a two-car diesel train. It burns fuel and does not need the electric grid.”') },
        { id: 'ltd5', kind: 'dialogue', speaker: s('阿达', 'Ada'), tone: s('让机务灯照向坏掉的启动机，又指向雨窗外的道岔', 'lighting the dead starter, then pointing through the rain-streaked window toward the switch'), text: s('“可启动机坏了，油只够一条支线，洪水快到道岔了。我们只能先做一件事——你决定。”', '“But the starter is dead, fuel will cover one branch, and the water is nearly at the switch. We can do one thing first—you decide.”') },
      ],
      choices: [
        { id: 'repair-starter', label: s('和阿达检修启动机', 'Repair the starter with Ada') },
        { id: 'search-fuel', label: s('趁雨势加剧前搜查燃料棚', 'Search the fuel shed before the rain worsens') },
        { id: 'address-passengers', label: s('站到车厢过道说明路线与同行规则', 'Explain the route and travel rules in the carriage aisle') },
      ],
    },
    characters: [
      { id: 'ada-mechanic', name: s('阿达', 'Ada'), role: s('机修学徒', 'Apprentice mechanic'), vitality: 82, stress: 48, initialStatus: 'known', skills: [{ id: 'repair', label: s('机修', 'Repair'), value: 5 }, { id: 'listen', label: s('判断异响', 'Mechanical Ear'), value: 3 }], detail: s('抱着机务灯，知道这列车每一处不该出现的声音。', 'She carries a mechanic’s lamp and knows every sound this train should not make.'), lore: s('她刚通过实操考试，却因没有正式证件而一直不敢自称机修师。', 'She passed her practical exam but still refuses the title of mechanic without the missing certificate.') },
      { id: 'ren-medic', name: s('任医生', 'Doctor Ren'), role: s('乡镇急诊医生', 'Rural emergency doctor'), vitality: 76, stress: 36, initialStatus: 'known', hiddenUntilIntroduced: true, skills: [{ id: 'medicine', label: s('急救', 'Medicine'), value: 5 }, { id: 'calm', label: s('安抚', 'Calm'), value: 3 }], detail: s('带着不完整的急救箱，先登记伤员再谈自己去哪。', 'He carries an incomplete medical case and records the injured before discussing his own destination.'), lore: s('他错过撤离车，因为留下来给最后两名病人缝合。', 'He missed evacuation because he stayed to close the last two wounds.') },
      { id: 'lin-scout', name: s('林澈', 'Lin'), role: s('线路巡检员', 'Track inspector'), vitality: 88, stress: 31, initialStatus: 'known', hiddenUntilIntroduced: true, skills: [{ id: 'scout', label: s('侦察', 'Scouting'), value: 5 }, { id: 'routes', label: s('线路记忆', 'Route Memory'), value: 4 }], detail: s('在更北边失联，只有一段断续电台呼号证明他还活着。', 'Missing farther north, with only a broken radio call proving he may be alive.'), lore: s('他知道一条地图没有标出的木场侧线，也知道调度员为何关闭它。', 'He knows an unmarked timber siding and why the dispatcher sealed it.') },
      { id: 'mara-raider', name: s('玛柯', 'Mako'), role: s('货场守卫队长', 'Freight-yard guard captain'), vitality: 90, stress: 55, initialStatus: 'known', hiddenUntilIntroduced: true, skills: [{ id: 'defense', label: s('防卫', 'Defense'), value: 5 }, { id: 'command', label: s('统率', 'Command'), value: 4 }], detail: s('控制灰石货场燃料，声称所有扣留都为附近避难点。', 'Controls Graystone Yard fuel and claims every seizure protects nearby shelters.'), lore: s('他可以成为危险敌人、严格盟友或临时同行者，取决于药品与燃料的第一次交换。', 'He may become an enemy, strict ally or temporary companion depending on the first medicine-for-fuel exchange.') },
    ],
    initialMap: [
      { id: 'dead-station', label: s('北岬死站', 'North Cape Dead Station'), current: true, visited: true, detail: s('被洪水和停电遗弃的乡镇终点站，侧线剩下一列可抢修的两节编组柴油列车。', 'A rural terminus abandoned by flood and blackout, with one repairable two-car diesel train on its siding.'), lore: s('这不是按计划到来的救援列车；它只是全站最后一件还能移动的公共交通工具。', 'This is not the promised rescue train. It is simply the station’s last piece of public transport that might still move.'), facts: [s('47 人已进入列车车厢', '47 people are aboard'), s('出站道岔即将进水', 'departure switch is flooding')] },
      { id: 'river-valley', label: s('河谷支线', 'River Valley Branch'), connectedTo: s('北岬死站', 'North Cape Dead Station'), detail: s('通往诊所与断桥的短线。', 'Short branch toward a clinic and damaged bridge.'), lore: s('这里可能有氧气，也可能让整列车困在河谷。', 'It may hold oxygen or trap the whole train in the valley.') },
      { id: 'graystone-yard', label: s('灰石货场', 'Graystone Yard'), connectedTo: s('北岬死站', 'North Cape Dead Station'), detail: s('有燃料罐和临时守卫的采石场货站。', 'A quarry freight yard with fuel tanks and temporary guards.'), lore: s('谁控制燃料，谁就会误以为自己控制所有人的方向。', 'Whoever controls fuel may believe they control everyone’s direction.') },
      { id: 'pine-line', label: s('黑松林线', 'Black Pine Line'), connectedTo: s('北岬死站', 'North Cape Dead Station'), detail: s('地图外的旧木场线，信号没有回声。', 'An old timber line beyond the current map, with no signal return.'), lore: s('短路从不等于安全，只意味着没人承担确认。', 'A shorter line is not a safe line; it means no one stayed to confirm it.') },
      { id: 'tunnel', label: s('白石隧道', 'White Stone Tunnel'), detail: s('穿过山腹的唯一主线，通风机已经停转。', 'The only main line through the mountain; ventilation is dead.'), lore: s('进入隧道前，列车必须决定哪些东西值得占据有限空间。', 'Before the tunnel, the train must decide what deserves limited space.') },
      { id: 'mountain-pass', label: s('山口线', 'Mountain Pass'), detail: s('长下坡、旧信号与失控货车共同构成的高风险线。', 'A high-risk line of long grades, old signals and runaway freight.'), lore: s('岗位是否可信，会在这里变成物理事实。', 'Trust in each crew role becomes a physical fact here.') },
      { id: 'sleeping-town', label: s('沉睡小城', 'Sleeping Town'), detail: s('仍有电灯却没有广播回应的小城站。', 'A town station with lights but no broadcast response.'), lore: s('有些地方不是危险，只是让人很难继续离开。', 'Some places are not dangerous; they simply make leaving difficult.') },
      { id: 'dawn-junction', label: s('黎明枢纽', 'Dawn Junction'), detail: s('洪水桥后的区域铁路中心，也是所有路线的终点。', 'The regional rail center beyond the flood bridge and the end of every route.'), lore: s('抵达只能回答怎么活下来，不能替所有人决定以后听谁的。', 'Arrival answers how to survive, not who everyone must obey afterward.') },
    ],
    initialInventory: [
      { id: 'master-switch-key', label: s('总调度钥匙', 'Master Switch Key'), count: 1, rarity: 'legendary', detail: s('三齿黄铜总钥匙，可机械覆盖封闭道岔。', 'A three-tooth brass master key that mechanically overrides sealed switches.'), effect: s('打开一座封闭道岔房或隐藏维修线；每次使用永久折断一枚钥匙齿。', 'Opens one sealed switch house or hidden maintenance route; each use permanently shears one tooth.'), lore: s('北岬站负伤的值班调度员在被抬去医务角前交给玩家。', 'North Cape’s injured station dispatcher gave it to the player before being carried to the medical corner.'), metrics: [{ id: 'remaining-overrides', label: s('剩余覆盖', 'Overrides'), value: '3' }, { id: 'material', label: s('材质', 'Material'), value: s('铁路黄铜', 'Rail brass') }], imagePrompt: 'single heavy three-tooth brass railway master switch key on cream route paper and wet dark steel, object only, no hands, no readable text, square' },
      { id: 'field-radio', label: s('铁路电台', 'Rail Field Radio'), count: 1, rarity: 'common', detail: s('电池剩余一半，只能稳定接收近距离线路呼号。', 'Half-charged radio that reliably receives only nearby rail calls.'), effect: s('在进入危险前确认一次远处声音或求救是否真实。', 'Confirms whether one distant call or warning is real before entering danger.'), lore: s('死站值班室唯一仍能工作的公共电台。', 'The only public radio still working in the station office.'), metrics: [{ label: s('电量', 'Charge'), value: '52%' }], imagePrompt: 'single rugged railway field radio with blank screen and worn antenna on wet steel, object only, no people, no readable text, square' },
      { id: 'spare-hose', label: s('制动软管', 'Spare Brake Hose'), count: 1, rarity: 'common', detail: s('适配这列老式柴油列车二号转向架的备用软管。', 'A spare hose fitting the old diesel train’s second bogie.'), effect: s('停车时消耗，可恢复 10 点车况并消除一次制动裂纹事实。', 'Consumed while stopped to restore 10 Condition and clear one brake-hose fault.'), lore: s('阿达从报废检修列车上拆下并重新封存。', 'Ada reclaimed and resealed it from a retired maintenance train.'), metrics: [{ label: s('耐压', 'Pressure'), value: '1.0 MPa' }], imagePrompt: 'single coiled railway brake hose with steel couplings and inspection tag turned blank, object only, no people, no readable text, square' },
    ],
    initialPartyMemberIds: [],
    demoTurns: zh ? demoZh : demoEn,
  }
}

const demoEn = [
  {
    match: ['repair starter', 'starter', 'repair'],
    imageSubject: 'player' as const,
    imagePrompt: demoZh[0].imagePrompt,
    content: `You remove the starter housing. Water has missed the main coil, but a burned relay is welded to its contact. Ada lowers the work lamp so you can reach the copper plate.
[skill_check: skill="Emergency Repair" dc="9" rolls="11" modifier="2" total="13" result="success"]
[widget: condition, add: 5]
[party_change: character_id="ada-mechanic" character="Ada" change="add" role="Apprentice mechanic" detail="She sees you are not gambling with the train or its passengers and takes the engineering post" lore="She passed her final practical exam before the flood but still believes she is unqualified" vitality="82" stress="42" skills="Repair: 5|Mechanical Ear: 3"]
[fact: id="starter-repaired" value="true"]
The engine misses once, then catches. The fuel gauge holds below seven-tenths. The west fuel shed stands half open; people are already fighting over seats in the waiting hall.
[state: value="Complete departure preparations and stabilize the first passengers"]
[choices: "Search the west fuel shed while the engine warms"|"Have Ada inspect the brakes and bogies"|"Set the route and boarding rules in the waiting hall"]`,
  },
  {
    match: ['fuel shed', 'search', 'diesel'],
    imageSubject: 'player' as const,
    imagePrompt: demoZh[1].imagePrompt,
    content: `Most drums in the fuel shed are contaminated. On a high rack you find two sealed railway cans and a hand pump. Three figures are approaching through the rain.
[inventory: action="add" item_id="sealed-diesel" item="Sealed Diesel Cans" count="2" rarity="common" detail="Two intact twenty-liter railway reserve cans" effect="Convert to Fuel while stopped; moving them occupies one crew member" lore="Emergency stock rotated monthly before the station died" metrics="Capacity: 40 L|State: seals intact" image_prompt="two sealed red railway diesel cans and a manual transfer pump on wet concrete, object only, no people, no readable text, square"]
[widget: fuel, add: 14]
[fact: id="fuel-shed-salvaged" value="true"]
They carry no weapons. They are pushing a feverish child and offer a field radio for three places aboard.
[choices: "Accept the trade and bring all three aboard"|"Inspect the radio and the child first"|"Refuse the trade but give them one can of fuel"]`,
  },
  {
    match: ['waiting hall', 'boarding rules', 'route'],
    imageSubject: 'player' as const,
    imagePrompt: demoZh[2].imagePrompt,
    content: `You promise no one a perfect arrival. You publish three rules instead: danger is announced; supplies and duties are recorded; anyone may leave at the next stop.
[widget: morale, add: 12]
[character_update: character_id="ren-medic" character="Doctor Ren" role="Rural emergency doctor" detail="He carries an incomplete medical case and volunteers to register the injured" lore="He missed evacuation because he stayed to close the last two wounds" vitality="76" stress="36" skills="Medicine: 5|Calm: 3"]
[fact: id="passenger-rules-public" value="true"]
Ren says an elderly passenger needs oxygen within two hours. The valley clinic may have it. The quarry line has fuel. The forest route is shorter, but the radio returns no echo.
[choices: "Take the river valley branch for oxygen"|"Take the quarry line to secure fuel"|"Scout the silent forest line before committing"]`,
  },
  {
    match: ['inspect brakes', 'brake hose', 'bogie'],
    imageSubject: 'others' as const,
    imagePrompt: demoZh[3].imagePrompt,
    content: `Ada crawls beneath the second bogie and stops at the fourth brake line. The outer rubber is split; the steel braid still holds. Replacing it costs time. Running it risks pressure loss on a long descent.
[character_update: character_id="ada-mechanic" character="Ada" role="Apprentice mechanic" detail="She found a cracked brake hose and is waiting for your decision" lore="She will remember whether the player respects professional warnings" vitality="82" stress="38" skills="Repair: 5|Mechanical Ear: 3"]
[fact: id="brake-hose-warning" value="true"]
[choices: "Replace the hose now and spend the spare"|"Record the fault, limit speed and depart"|"Assign Ada a volunteer so they can replace it in parallel"]`,
  },
  {
    match: ['river valley', 'oxygen', 'clinic'],
    imageSubject: 'environment' as const,
    imagePrompt: demoZh[4].imagePrompt,
    content: `The switch locks onto the valley line. Seventeen minutes later the headlamp reveals half a bridge pier washed away. The clinic is across the river; only one rail and a maintenance beam remain intact.
[map_update: new_location="Valley Break" connected_to="Dead Station" detail="A short clinic bridge has lost half its support" lore="No one can judge its remaining load by sight" facts="Clinic across the river|Pier still eroding"]
[fact: id="route-family" value="valley"]
[clock: value="Night One · 02:41"]
[encounter: phase="warning" kind="Broken valley bridge" severity="2"]
[state: value="Cross before the remaining pier fails"]
[choices: "Creep onto the main rail and test the bridge with the train"|"Unload the passengers and cross on foot for oxygen"|"Use the Master Switch Key on the downstream maintenance siding"]`,
  },
  {
    match: ['quarry line', 'fuel yard', 'graystone'],
    imageSubject: 'environment' as const,
    imagePrompt: demoZh[5].imagePrompt,
    content: `A temporary gate blocks the quarry line. The fuel tanks are full, but three flashlights ignite on the loading gantry. A loudspeaker demands medicine before the pump is opened.
[map_update: new_location="Graystone Yard" connected_to="Dead Station" detail="A quarry freight yard with fuel tanks controlled by temporary guards" lore="They claim to protect three nearby shelters; others say they seize every passing vehicle" facts="Fuel available|Guards control the pump"]
[fact: id="route-family" value="quarry"]
[encounter: phase="warning" kind="Fuel blockade" severity="2"]
[choices: "Park behind cover and prepare to seize the pump"|"Send Doctor Ren to negotiate medicine for fuel"|"Circle behind the tanks on the old coal spur"]`,
  },
  {
    match: ['forest line', 'scout', 'no signal'],
    imageSubject: 'player' as const,
    imagePrompt: demoZh[6].imagePrompt,
    content: `The forest line is not empty. Wheel marks less than an hour old cut the wet ties. Someone manually set the signal to safe without connecting its circuit. Steel wheels are rolling backward beyond the bend.
[map_update: new_location="Black Pine Line" connected_to="Dead Station" detail="An overgrown timber branch with a falsified safe signal" lore="The branch once served a closed sawmill" facts="Fresh wheel marks|A vehicle is rolling backward"]
[fact: id="route-family" value="forest"]
[encounter: phase="warning" kind="Runaway freight cars" severity="3"]
[choices: "Run back and organize an emergency reverse"|"Climb the signal frame to judge the distance"|"Use the Master Switch Key on the abandoned timber siding"]`,
  },
  {
    match: ['master switch key', 'maintenance siding', 'hidden route'],
    imageSubject: 'player' as const,
    imagePrompt: demoZh[7].imagePrompt,
    content: `The Master Switch Key enters the hand crank. One brass tooth shears in the lock, but a sealed maintenance route reconnects through weed and floodwater.
[skill_check: skill="Manual Switch" dc="13" rolls="14" modifier="1" total="15" result="success"]
[fact: id="switch-key-uses" value="1"]
[fact: id="hidden-route-open" value="true"]
[widget: fuel, remove: 8]
[encounter: phase="resolution" kind="Blocked route" severity="2" outcome="success"]
The train bypasses the danger. An old rescue carriage waits at the siding end with oxygen, cable—and someone still pounding on its locked door.
[choices: "Free the trapped person first"|"Transfer the oxygen and cable first"|"Find out why the rescue carriage was locked from outside"]`,
  },
  {
    match: ['commit', 'hold the line', 'emergency reverse', 'test the bridge', 'seize the pump'],
    imageSubject: 'player' as const,
    imagePrompt: demoZh[8].imagePrompt,
    content: `You choose to beat the danger before it finishes forming. Train and rail groan together while Ada calls vibration changes over the radio.
[skill_check: skill="Direct Response" dc="14" rolls="10" modifier="2" total="12" result="costly-success"]
[widget: condition, remove: 12]
[widget: morale, add: 4]
[fact: id="first-danger-method" value="direct"]
[encounter: phase="resolution" kind="First route crisis" severity="3" outcome="costly-success"]
The train clears the worst section, but the second bogie fault grows. A lamp glows at the next platform; someone is waving white cloth.
[state: value="Decide whether to stop at the lit platform"]
[choices: "Stop and let Ada inspect the bogie"|"Hold position and send two people toward the platform"|"Keep moving and ask for identification by radio"]`,
  },
  {
    match: ['negotiate', 'trade', 'radio', 'doctor ren'],
    imageSubject: 'others' as const,
    imagePrompt: demoZh[9].imagePrompt,
    content: `Doctor Ren opens the medical case so the other side can see what can be shared and what cannot be replaced. Their leader finally hands over the pump and a list of shelters.
[skill_check: skill="Bounded Negotiation" dc="12" rolls="13" modifier="2" total="15" result="success"]
[widget: fuel, add: 16]
[widget: morale, add: 8]
[fact: id="first-danger-method" value="negotiate"]
[fact: id="aid-network-known" value="true"]
[encounter: phase="resolution" kind="First route crisis" severity="2" outcome="success"]
You leave without every liter of fuel, but with a rescue network that can verify the train at later stops.
[choices: "Add the shelters to the route map"|"Invite the yard electrician to join the crew"|"Leave medicine and depart immediately"]`,
  },
  {
    match: ['detour', 'inspect', 'approach platform', 'cross on foot'],
    imageSubject: 'player' as const,
    imagePrompt: demoZh[10].imagePrompt,
    content: `You refuse to wager the entire train on one guess. A narrow inspection path reveals the actual stress point; a forgotten tool case pins down an old detour chart.
[skill_check: skill="Scout Detour" dc="12" rolls="16" modifier="1" total="17" result="success"]
[inventory: action="add" item_id="bridge-kit" item="Bridge Inspection Kit" count="1" rarity="rare" detail="Cable clamps, sounding hammer and two short-circuit signal lamps" effect="Reduce the severity of one bridge, tunnel or track danger; consumed on use" lore="Standard equipment left by an old railway rescue team" metrics="Uses: 1|Weight: 12 kg" image_prompt="single battered railway bridge inspection kit with cable clamps, sounding hammer and two blank signal lamps, object only, no people, no readable text, square"]
[fact: id="first-danger-method" value="scout"]
[encounter: phase="resolution" kind="First route crisis" severity="2" outcome="success"]
The case also holds a hand-drawn elevation chart for the next mountain section, enough to bypass a submerged grade.
[choices: "Plan the mountain route with the elevation chart"|"Return to treat the injured first"|"Give the inspection kit to Ada"]`,
  },
  {
    match: ['lit platform', 'inspect bogie', 'add shelters', 'free the trapped', 'transfer the oxygen'],
    imageSubject: 'others' as const,
    imagePrompt: demoZh[11].imagePrompt,
    content: `The train stops at the lit platform. Ada replaces the split hose, Doctor Ren receives the oxygen, and the new passengers describe the mountain route one obstruction at a time.
[widget: condition, add: 10]
[widget: morale, add: 6]
[fact: id="chapter-dead-station-complete" value="true"]
[clock: value="Night One · 03:26"]
[state: value="Chapter One complete: the train has become a real crew"]
[session_end: reason="Dead Station departure chapter complete; the full journey continues beyond the first branch"]
When the wheels turn again, no one asks whether you are the official conductor. They ask only: who are we trying to save at the next stop?
[choices: "Continue toward the mountain and Chapter Two"|"Review crew duties and supplies"|"Review the promises already made along the route"]`,
  },
]

export const lastTrainToDawn = build('zh')
export const lastTrainToDawnEn = build('en')
