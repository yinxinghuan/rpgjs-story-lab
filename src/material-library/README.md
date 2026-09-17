# 地面与屋顶材质目录

当前是随项目分发的本地素材库，不需要部署数据库。

- `catalog.json`：地面目录，原有准入规则不变。
- `roof-catalog.json`：首批四种屋顶，含稳定ID、材质类型、PNG来源/哈希、图像尺寸、裁切、世界尺度、采样密度、檐沟是否在原图内、准入状态及评审链接。
- `getRoofMaterial(id)` 默认拒绝候选；本项目显式使用 `allowCandidate:true` 做本地验证。其他游戏不得把候选静默当成认可基准。
- `roofMaterialSampling(id)` 将每40地图单位的屋面宽统一采样为80像素。先按原crop保持瓦片大小，再统一texel密度，不能为了颗粒感直接放大瓦片。
- `RoofMaterialSurface` 为通用SVG显示组件：传材质ID、已加载图像URL、位置尺寸和檐沟朝向；一次Canvas采样后缓存，SVG仅负责按原世界尺寸重复。独立于剧情/碰撞。
- 新材质：平台生成→检查真实图像→登记来源与crop→声明worldWidth及pixelsPerWorldUnit→放到目标镜头比较→评审状态。重复接缝未验收时保留 `seamless:unverified`，不得仅因提示词写了seamless就宣称无缝。
- 场景分配位于 `old-street-roof-materials.ts`；同一建筑前后材质相同，变化发生在建筑之间，不随刷新随机切换。

本地对照：`/_qa-roof-materials.html`，不进入正式构建入口。
