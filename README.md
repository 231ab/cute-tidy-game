# starG
# ✨ 星尘花园 - 闯关小游戏

治愈系收集类游戏，**单HTML文件 + 零外部依赖**，完美适配 Cloudflare Pages。

## 🚀 一键部署

### 方法一：GitHub + Cloudflare Pages（推荐）

1. 创建 GitHub 仓库，上传 `index.html` 和 `_routes.json`
2. 访问 [Cloudflare Pages](https://pages.cloudflare.com/)
3. 点击 **"Create a project"** → **"Connect to Git"**
4. 选择你的仓库
5. 构建设置：
   - **Framework preset**: `None`
   - **Build command**: *留空*
   - **Build output directory**: *留空*
6. 点击 **"Save and Deploy"**

✅ 30秒内自动部署完成，获得全球CDN加速的HTTPS游戏链接！

### 方法二：Wrangler CLI（本地部署）

```bash
# 1. 安装 Wrangler
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 部署到 Pages
wrangler pages publish .
