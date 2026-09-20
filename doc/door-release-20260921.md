# 原生投影门手机测试发布

本次采用细节丰富的四款平台门素材，不采用简化试验版。原图仅去除洋红底，游戏按宽度 48 等比显示原生投影，高度约 66.1–67.2；删除额外顶面和侧面厚度补片，保留关门封口、碰撞与铰链位置。

实现入口为 `src/old-street-side-passage.tsx`，资产登记为 `src/material-library/side-door-catalog.json`，去底复现脚本为 `scripts/prepare-native-side-doors.ts`。请求、原图和哈希保存在 `doc/door-projection-20260920/`。

本地六场景、两手机视口的真实 renderer 检查及 11 项定向测试已通过；真实手机观感由用户上线后测试，不将截图等同于实体手机验收。未提交的存档恢复改动不纳入本次发布。
