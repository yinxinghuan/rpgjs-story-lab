# 完整委托默认入口整合

此前完整委托只在`dev:campaign`或显式实验登记中创建；直接部署cloud构建仍给普通新玩家较短的旧探索。现在前后端共用已开启的campaign试玩能力，cloud/cloud-preflight默认新登记为v4，正式成品开关保持关闭，界面仍标注试玩。下一次整合部署才影响线上。

保留旧旅程，不回填新门槛；续玩已有记录与完成待确认登记优先于新版默认值。静态Pages入口不创建第二套旅程或后台。新建不请求生成，内容仍在已提交探索节点或现场操作时准备。

## 已验证

- `node --import tsx --test _qa/old-street-campaign-entry.test.ts _qa/old-street-campaign-release.test.ts _qa/old-street-worker.test.ts`：18项通过。
- 新增测试加载编译后的`worker/index.js`，通过正式客户端及health握手、Worker路由、落盘SQLite验证新旧旅程共存、重开恢复、丢新建响应后不重复开户；零模型调用。
- `npm run build`通过，含TypeScript、空间合同、前端资源核对与Worker启动；构建仍有既存大chunk／旧cartridge媒体URL警告，不能称警告清零。
- 真实浏览器`http://127.0.0.1:55678/`无实验参数打开，显示完整委托开场；“开始探索”收起面板，正常“随身”入口显示“取回密封信，查清寄存的旧事，再寻找相关的旧照片”。
- 截图`_qa/ui/campaign-entry-release-20260917/platform-layout-commission.png`；桌面默认1280×720，外部访客栏通过自身关闭按钮收起，不是iPhone验收。
- 公开凭据扫描通过。

首次本地服务因沙箱端口监听受限退出，取得本机监听权限后启动成功；失败页不可被工具读取，改为打开已就绪服务的新标签。没有绕过浏览器安全警告或改变系统保护。

本轮没有调用模型／媒体，没有发布主站或Pages，也没有重测全部路线。完整真实生成旅程基线见`campaign-live-journey-20260917.md`。下一步聚焦调查内容的实质差异与可见选择后果，再集中做版本部署及平台验收。
