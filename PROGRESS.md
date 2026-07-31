# 进度快照 · 蕾蕾 OS PWA

> 时间：2026-07-31
> 状态：PWA 配置 + HTTPS 公网链接 已完成并验证通过

---

## 一、当前可用 HTTPS 链接（手机 Safari 可直接打开）

### 主链接（推荐，http2 协议更稳）
https://toxic-highways-head-rosa.trycloudflare.com

### 备用链接（QUIC，可能更快但偶尔抖动）
https://eclipse-blah-wild-criticism.trycloudflare.com

⚠️ **重要**：这两条是 cloudflared **临时 quick tunnel**，URL 在隧道重启后会变。下面"长期有效"方案见第五节。

---

## 二、PWA 配置（全部已完成 ✅）

### 文件清单
| 文件 | 作用 | 状态 |
|------|------|------|
| `index.html` | PWA meta 标签 + SW 注册 | ✅ |
| `public/manifest.webmanifest` | 应用清单 | ✅ |
| `public/sw.js` | Service Worker（离线缓存） | ✅ |
| `public/icon.svg` | 矢量图标源 | ✅ |
| `public/icon-{192,256,384,512}.png` | PWA 图标 any | ✅ |
| `public/icon-maskable-512.png` | 可屏蔽图标 | ✅ |
| `public/apple-touch-icon.png` (180x180) | iPhone 主屏图标 | ✅ |
| `public/favicon-32.png` | 浏览器标签图标 | ✅ |
| `gen_icons.py` | 图标生成脚本（改图标后重跑） | ✅ |
| `vite.config.ts` | 加了 `preview.allowedHosts:true` | ✅ |

### manifest 关键配置
- `name`: "玥莹 Personal OS"
- `short_name`: "蕾蕾 OS"
- `display`: "standalone"
- `orientation`: "portrait"
- `theme_color`: "#1a1a1a"（墨黑，主色）
- `background_color`: "#fbfbfa"（暖白，底色）
- 图标：192/256/384/512 + maskable 512 + 32 favicon + 180 apple-touch

### index.html 关键 meta
- `viewport` 带 `viewport-fit=cover`（适配刘海/灵动岛）
- `apple-mobile-web-app-capable=yes` + `mobile-web-app-capable=yes`
- `apple-mobile-web-app-status-bar-style=black-translucent`（沉浸式状态栏）
- `apple-mobile-web-app-title=蕾蕾 OS`
- `apple-touch-icon` 指向 180 图标
- 内联 SW 注册脚本

### Service Worker 策略
- 预缓存：`/`、`/index.html`、`/manifest.webmanifest`、`/apple-touch-icon.png`
- 静态资源（/assets/、js/css/png/svg）：缓存优先
- 导航请求：网络优先，失败回退缓存，最后回退 index.html
- 不缓存后端 API（`/api/`）和跨域请求
- 打开一次后，弱网/离线仍可访问 ✅

---

## 三、已验证通过的项目 ✅

1. **HTTPS 可访问**：`/`、`/manifest.webmanifest`、`/sw.js`、`/apple-touch-icon.png`、`/icon-192.png`、`/icon.svg` 全部 200
2. **manifest Content-Type 正确**：`application/manifest+json`
3. **sw.js Content-Type 正确**：`text/javascript`
4. **无横向溢出**：
   - 375px（iPhone SE/mini）：`scrollWidth=375 = clientWidth=375` ✅
   - 390px（iPhone 14）：`scrollWidth=390 = clientWidth=390` ✅
   - 430px（iPhone Pro Max）：`scrollWidth=430 = clientWidth=430` ✅
5. **安全区域适配**：CSS 已用 `env(safe-area-inset-top/bottom)` + `--safe-top/--safe-bottom` 变量，刘海/灵动岛/底部 Home Indicator 都已适配
6. **LocalStorage 数据持久化**：刷新不丢，演示数据/真实数据分离，导出/导入/恢复演示数据功能在「我」页面

---

## 四、iPhone 添加到主屏幕步骤

1. Safari 打开上面的 HTTPS 链接
2. 点底部「分享」→「添加到主屏幕」
3. 桌面出现"蕾蕾 OS"图标（黑底白字"玥"）
4. 点开 → 全屏独立运行，无地址栏，沉浸状态栏

---

## 五、让链接"长期有效"的方案（选一个）

### 方案 A：Cloudflare Pages（推荐，免费、永久）
```
# 一次性登录授权（浏览器弹窗点确认）
npx wrangler login

# 之后每次发布（一行命令）
npm run build
npx wrangler pages deploy dist --project-name=leilei-os
```
得到 `https://leilei-os.pages.dev` 永久链接，项目更新随时重新部署。

### 方案 B：保持 cloudflared tunnel 常驻（当前方案）
- URL 是临时的，机器重启或隧道断开后 URL 变化
- 想要固定 URL 需登录 Cloudflare 做 named tunnel：
```
npx wrangler login
npx cloudflared tunnel create leilei-os
# 配置 DNS + config.yml 后隧道固定
```

### 方案 C：改图标/改项目后重新发布
```bash
# 1. 改图标（改 gen_icons.py 或替换 public/*.png）
cd c:\Users\王玥莹\Desktop\app
backend\.venv\Scripts\python.exe gen_icons.py

# 2. 重新构建
npm run build

# 3. 重启预览（保持隧道）
npx vite preview --port 4173 --host
# 隧道进程不重启的话，URL 不变，内容自动更新
```

---

## 六、恢复到上一版本（回滚）

### 当前没有版本管理。建议初始化 git 做版本快照：
```bash
cd c:\Users\王玥莹\Desktop\app
git init
git add -A
git commit -m "PWA 完成 · HTTPS 部署"
```
之后每次发布前 `git commit`，回滚 `git checkout <hash> -- .` 即可。

---

## 七、后台进程（当前在跑）

| 进程 | 端口/作用 |
|------|-----------|
| `npx vite preview --port 4173 --host` | 本地预览构建产物（4173） |
| `npx cloudflared tunnel --protocol http2 --url http://localhost:4173` | HTTPS 隧道 → toxic-highways 链接 |
| （旧的 QUIC 隧道） | → eclipse-blah 链接 |
| `backend\.venv\Scripts\python.exe backend\fetch_trending.py` | 热点抓取后端（5174，可选） |

⚠️ 机器关机/重启后这些进程会停，链接失效。要长期在线用第五节方案 A。

---

## 八、本次未完成/待办

- [ ] 真正长期固定 URL（需 `wrangler login` 授权一次，用户决定）
- [ ] git 初始化做版本管理
- [ ] 热点跟踪的"按博主主页链接抓取"尚未实现真实抓取（只有公共热榜）
