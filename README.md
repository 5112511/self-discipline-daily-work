# 蕾蕾 OS · 玥莹 Personal OS

> 一个为个人生活与自媒体创作打造的全能操作系统 —— 计划 / 项目 / 日程 / 收集箱 / 账本 / 热点跟踪，以 iPhone 级别的原生 App 体验呈现，可作为 PWA 安装到主屏幕离线使用。

<p align="center"><strong>墨黑 · 暖白 · 极简 · iOS 质感</strong></p>

---

## 目录

- [✨ 功能总览](#-功能总览)
- [📱 五大主页 + 三大扩展视图](#-五大主页--三大扩展视图)
- [🎯 核心特色](#-核心特色)
- [🛠 技术栈](#-技术栈)
- [📦 项目结构](#-项目结构)
- [🚀 本地启动](#-本地启动)
- [📱 PWA 安装到 iPhone 主屏](#-pwa-安装到-iphone-主屏)
- [🌐 部署上线](#-部署上线)
- [🔄 重新发布与回滚](#-重新发布与回滚)
- [💾 数据说明](#-数据说明)
- [🔌 热点跟踪后端（可选）](#-热点跟踪后端可选)
- [🎨 自定义](#-自定义)
- [❓ FAQ](#-faq)

---

## ✨ 功能总览

| 领域 | 能力 |
|------|------|
| **今日计划** | Top3 重点 · 待办清单 · 时间轴 · 快速新建任务/灵感/日程/项目 |
| **项目管理** | 六大领域（内容创作 / AI 学习 / 旅行 / 健康 / 课程 / 生活）专属流水线，进度动态计算 |
| **日程时间轴** | 日历视图 · 日/周视图 · 拖拽排程 · 完成打卡 |
| **收集箱** | 一句话灵感速记 · 智能归档转任务 · 一键跳转关联项目 |
| **账本** | 多账户（现金/银行/支付宝/微信/信用卡/资产）· 收支流水 · 净资产快照 |
| **热点跟踪** | 微博热搜 / 小红书 / 抖音真实抓取 · 关键词过滤 · 对标博主 · 一键转选题或加入 AI 学习 |
| **专注模式** | 番茄钟 · 领域分类 · 会话统计 · 全屏沉浸 |
| **数据** | LocalStorage 持久化 · 导出 / 导入 JSON · 演示数据一键恢复 |

---

## 📱 五大主页 + 三大扩展视图

### 五个底部 Tab
1. **计划**（今日）—— 9:41 状态栏 · Top3 重点卡 · 今日任务 · 时间轴 · 领域分布热力图
2. **项目** —— 六大领域项目卡 · 进度环 · 倒计时 · 点击进入领域专属详情页
3. **日程** —— 月历 · 日视图时间轴 · 新建日程表单
4. **收集箱** —— 摘要卡 · 未整理灵感列表 · 今日已归档 · 转化面板（选领域→建任务→归档）
5. **我** —— 头像 / 显示名 / 连续天数 / 今日进度 · 数据导出导入 · 恢复演示数据 · 专注设置

### 三个扩展视图（侧边栏 / 项目详情进入）
- **账本** —— 账户列表 · 收支记录 · 月度趋势 · 净资产快照
- **热点跟踪** —— 本周趋势 · 创作热点选题（分类筛选 · 转选题 · 加入学习）· 领域分布 · 热力图 · 重点关注 · 抓取源配置面板
- **项目详情** —— 各领域完整子结构（内容流水线 / AI 学习列表 / 旅行清单 / 健康里程碑 / 课程课时 / 生活项），含"来自收集箱的任务"区块

---

## 🎯 核心特色

### 1. 动态进度引擎
项目进度不再写死。`recomputeProjectProgress` 根据各领域子项实时计算 0–100：
- **内容创作**：按 Stage（灵感→选题→脚本→待拍摄→剪辑→待发布→已发布）推进加权
- **旅行**：Checklist 完成比例
- **健康**：里程碑 + 投资人沟通步骤
- **课程**：课时准备完成数
- **生活**：生活项完成比例
- **AI 学习**：学习项进度均值

### 2. 收集箱智能归档
- 灵感可带 `domain` 字段，归档时自动转入对应领域项目
- 未带 domain 的默认进「内容创作」
- 归档即建任务并关联 `projectId`，项目详情页"来自收集箱"区块可见
- 支持从未整理项和已归档项一键跳转关联项目

### 3. 热点跟踪真实抓取
- 前端配置关键词 + 对标博主 + 抓取平台
- 开启"启用真实抓取"后调用本地 Python 后端
- 后端真实抓取微博热搜 / 小红书探索页 / 抖音热榜，按关键词过滤
- 抓取失败自动回退本地模拟池（保证可用）
- 真实结果带"真实"角标 + 原文链接
- 一键"转选题"进内容创作，或"加入学习"进 AI 学习项目

### 4. iPhone 原生质感
- 自绘状态栏（9:41 · 信号 · WiFi · 电池 · 灵动岛）
- `viewport-fit=cover` + `env(safe-area-inset-*)` 完整适配刘海/灵动岛/Home Indicator
- `apple-mobile-web-app-status-bar-style: black-translucent` 沉浸式状态栏
- 灰阶极简色板（墨黑 #1a1a1a + 暖白 #fbfbfa），ins 感卡片 + 极轻阴影
- 系统字体栈（SF Pro / PingFang SC）
- 毛玻璃顶栏 / 底栏 Tab + FAB 悬浮按钮

### 5. PWA 离线可用
- Service Worker 预缓存首页 + 静态资源
- 打开一次后，弱网或离线仍可访问
- 可安装到 iPhone 主屏，全屏独立运行，无浏览器地址栏

---

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| 框架 | React 18 + TypeScript 5 |
| 构建 | Vite 5 |
| 样式 | 纯 CSS（CSS 变量 + 媒体查询，无 UI 库） |
| 状态 | 自研轻量 store（LocalStorage + 发布订阅） |
| PWA | manifest.webmanifest + Service Worker + iOS meta |
| 热点后端 | Python Flask + requests + BeautifulSoup（可选） |
| 部署 | Cloudflare Tunnel（临时）/ Cloudflare Pages（永久，推荐） |

---

## 📦 项目结构

```
app/
├── index.html                 # PWA meta + SW 注册
├── vite.config.ts             # Vite 配置（含 preview.allowedHosts）
├── package.json
├── public/                    # PWA 静态资源
│   ├── manifest.webmanifest   # 应用清单
│   ├── sw.js                  # Service Worker
│   ├── icon.svg               # 矢量图标源
│   ├── icon-{192,256,384,512}.png
│   ├── icon-maskable-512.png
│   ├── apple-touch-icon.png   # 180x180 iPhone 主屏图标
│   └── favicon-32.png
├── gen_icons.py               # 图标生成脚本（Pillow）
├── backend/                   # 热点抓取后端（可选）
│   ├── fetch_trending.py      # Flask 服务
│   ├── requirements.txt
│   └── .venv/                 # Python 虚拟环境
└── src/
    ├── App.tsx                # 根组件 + 全局上下文
    ├── main.tsx
    ├── store.ts               # 数据层（LocalStorage + 订阅 + 所有业务方法）
    ├── types.ts               # 全部类型定义
    ├── data.ts                # 演示数据
    ├── palette.ts             # 领域色映射
    ├── useStore.ts            # 订阅 hook
    ├── components/
    │   ├── TabBar.tsx         # 底栏 + FAB + ActionSheet
    │   ├── TaskSheet.tsx      # 任务新建/编辑表单
    │   ├── FocusOverlay.tsx   # 专注模式全屏
    │   ├── SideDrawer.tsx     # 侧边栏
    │   ├── ConfirmSheet.tsx   # 确认弹窗
    │   ├── Toast.tsx          # 轻提示
    │   └── Icons.tsx          # SVG 图标集
    ├── pages/
    │   ├── TodayPage.tsx
    │   ├── ProjectPage.tsx
    │   ├── ProjectDetailPage.tsx
    │   ├── SchedulePage.tsx
    │   ├── InboxPage.tsx
    │   ├── MePage.tsx
    │   ├── LedgerPage.tsx
    │   └── TrendingPage.tsx
    └── styles/
        ├── global.css         # 全局 + 变量 + 安全区
        ├── pages.css
        └── today.css
```

---

## 🚀 本地启动

### 前端
```bash
cd c:\Users\王玥莹\Desktop\app
npm install
npm run dev          # 开发服务器 http://localhost:5173
npm run build        # 构建产物到 dist/
npm run preview      # 预览构建产物 http://localhost:4173
```

### 热点抓取后端（可选，默认用本地模拟池）
```bash
cd c:\Users\王玥莹\Desktop\app\backend
uv venv --python 3.14 .venv
uv pip install --python .venv\Scripts\python.exe -r requirements.txt
.venv\Scripts\python.exe fetch_trending.py
# 后端启动在 http://127.0.0.1:5174
```
然后在 App「热点跟踪」页 → 点 ⚙ 配置 → 开启"启用真实抓取" → 后端地址填 `http://127.0.0.1:5174`。

---

## 📱 PWA 安装到 iPhone 主屏

1. Safari 打开 HTTPS 链接
2. 点底部「分享」→「添加到主屏幕」
3. 桌面出现「蕾蕾 OS」图标（黑底白字"玥"）
4. 点开 → 全屏独立运行，无地址栏，沉浸式状态栏

**manifest 关键配置：**
- `name`: "玥莹 Personal OS" / `short_name`: "蕾蕾 OS"
- `display`: "standalone" / `orientation`: "portrait"
- `theme_color`: "#1a1a1a" / `background_color`: "#fbfbfa"
- 图标：192/256/384/512 + maskable 512 + 180 apple-touch + 32 favicon

---

## 🌐 部署上线

### 方案 A：Cloudflare Pages（推荐，免费永久）

```bash
# 一次性登录（浏览器弹窗点确认）
npx wrangler login

# 每次发布
npm run build
npx wrangler pages deploy dist --project-name=leilei-os
```
得到 `https://leilei-os.pages.dev` 永久链接。

### 方案 B：Cloudflare Tunnel（临时，无需登录）

```bash
# 1. 启动预览
npx vite preview --port 4173 --host

# 2. 开隧道（新窗口）
npx cloudflared tunnel --protocol http2 --url http://localhost:4173
```
输出形如 `https://xxx.trycloudflare.com` 的临时 HTTPS 链接。
⚠️ 机器重启或隧道断开后 URL 会变。

### 方案 C：Cloudflare Named Tunnel（固定 URL）
```bash
npx wrangler login
npx cloudflared tunnel create leilei-os
# 配置 DNS + config.yml 后隧道固定
```

---

## 🔄 重新发布与回滚

### 改图标
```bash
# 编辑 gen_icons.py（字体/颜色/字符）后重跑
cd c:\Users\王玥莹\Desktop\app
backend\.venv\Scripts\python.exe gen_icons.py
```

### 改项目代码后重新发布
```bash
npm run build
# 方案 A: npx wrangler pages deploy dist --project-name=leilei-os
# 方案 B: 隧道不停则 URL 不变，内容自动更新
```

### 版本管理（建议初始化 git）
```bash
cd c:\Users\王玥莹\Desktop\app
git init
git add -A
git commit -m "PWA 完成 · HTTPS 部署"
# 回滚
git checkout <hash> -- .
npm run build
```

---

## 💾 数据说明

- **持久化**：所有数据存浏览器 LocalStorage（key: `personal-os-data-v1`），刷新不丢
- **演示 vs 真实**：演示数据在 `src/data.ts`，真实数据在 LocalStorage，两者分离
- **导出**：「我」页 → 导出数据 → 下载 JSON
- **导入**：「我」页 → 导入数据 → 选 JSON 文件
- **恢复演示**：「我」页 → 恢复演示数据（会覆盖当前数据，有确认弹窗）
- **清空**：「我」页 → 清空所有数据（保留设置与抓取源配置）
- **不含敏感凭证**：前端不保存邮箱密码 / API Key，热点后端地址仅存本地

---

## 🔌 热点跟踪后端（可选）

### 接口
```
GET /api/trending?keywords=AI,减脂&platforms=weibo,xhs,douyin&fallback=1
```
- `keywords`：逗号分隔关键词，任一命中即保留
- `platforms`：`weibo` / `xhs` / `douyin` / `bilibili`
- `fallback=1`：抓取失败回退本地模拟池

### 返回
```json
{
  "ok": true,
  "count": 8,
  "real": 2,
  "items": [{ "title", "platform", "category", "angle", "keywords", "heat", "url", "source" }],
  "fetchedAt": 1785496602
}
```

### 抓取源
| 平台 | 接口 | 登录态 |
|------|------|--------|
| 微博热搜 | `s.weibo.com/top/summary` | 无需 |
| 小红书 | `xiaohongshu.com/explore` 首页 `__INITIAL_STATE__` | 部分内容 |
| 抖音热榜 | `iesdouyin.com` 公开 API | 无需 |

### 限制
- 小红书/抖音对未登录抓取限制较严，可能频繁回退模拟池
- "按博主主页链接抓取 TA 近期内容"尚未实现（需 cookie）

---

## 🎨 自定义

| 改什么 | 改哪里 |
|--------|--------|
| 应用名 / 短名 | `public/manifest.webmanifest` 的 `name` / `short_name` |
| 主题色 | manifest 的 `theme_color` + `index.html` meta + `src/styles/global.css` 的 `--ink` / `--accent` |
| 图标字符 | `gen_icons.py` 的 `text = '玥'`，重跑生成 |
| 领域 / 标签 | `src/types.ts` 的 `Domain` / `DOMAIN_LABEL` / `DOMAIN_ICON` |
| 演示数据 | `src/data.ts` |
| Service Worker 缓存策略 | `public/sw.js` |

---

## ❓ FAQ

**Q: 安装到主屏后数据会同步到其他设备吗？**
A: 不会。PWA 的 LocalStorage 是设备本地存储，每台设备独立。要跨设备同步需自建后端。

**Q: 离线能打开吗？**
A: 能。Service Worker 会缓存首页和静态资源，打开一次后弱网/离线均可访问。但热点抓取需后端在线。

**Q: 横向溢出吗？**
A: 已验证 375 / 390 / 430 三档 iPhone 宽度，`scrollWidth = clientWidth`，无溢出。

**Q: 临时隧道链接失效怎么办？**
A: 重新跑 `npx cloudflared tunnel --url http://localhost:4173` 获取新 URL，或部署到 Cloudflare Pages 获得永久链接。

**Q: 热点抓取显示"本地池"怎么办？**
A: 默认未启用真实抓取。进「热点跟踪」→ ⚙ 配置 → 开启"启用真实抓取"并确保 Python 后端在跑（`http://127.0.0.1:5174`）。

---

<p align="center">Made with ♥ by 玥莹 · 蕾蕾 OS</p>
