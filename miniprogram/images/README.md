# 小程序图片资源说明

本目录存放小程序所需的图片资源。

## 图片尺寸规范

### TabBar 图标
- **尺寸**: 81px × 81px（推荐）
- **格式**: PNG
- **模式**: 透明背景

| 文件名 | 说明 | 状态 |
|--------|------|------|
| `icon_home.png` | 首页图标（未选中） | ⚠️ 缺失 |
| `icon_home_active.png` | 首页图标（选中） | ⚠️ 缺失 |
| `icon_product.png` | 产品图标（未选中） | ⚠️ 缺失 |
| `icon_product_active.png` | 产品图标（选中） | ⚠️ 缺失 |
| `icon_order.png` | 订单图标（未选中） | ⚠️ 缺失 |
| `icon_order_active.png` | 订单图标（选中） | ⚠️ 缺失 |
| `icon_profile.png` | 个人中心图标（未选中） | ⚠️ 缺失 |
| `icon_profile_active.png` | 个人中心图标（选中） | ⚠️ 缺失 |

### 功能图标
- **尺寸**: 64px × 64px（推荐）
- **格式**: PNG
- **模式**: 透明背景

| 文件名 | 说明 | 状态 |
|--------|------|------|
| `icon_search.png` | 搜索图标 | ⚠️ 缺失 |
| `icon_heart.png` | 收藏图标（未选中） | ⚠️ 缺失 |
| `icon_heart_active.png` | 收藏图标（选中） | ⚠️ 缺失 |
| `icon_service.png` | 客服图标 | ⚠️ 缺失 |
| `icon_category_1.png` | 分类1图标 | ⚠️ 缺失 |
| `icon_category_2.png` | 分类2图标 | ⚠️ 缺失 |
| `icon_category_3.png` | 分类3图标 | ⚠️ 缺失 |
| `icon_category_4.png` | 分类4图标 | ⚠️ 缺失 |
| `icon_favorite.png` | 我的收藏图标 | ⚠️ 缺失 |
| `icon_address.png` | 地址图标 | ⚠️ 缺失 |
| `icon_about.png` | 关于图标 | ⚠️ 缺失 |
| `icon_safe.png` | 安全图标 | ⚠️ 缺失 |
| `icon_wechat.png` | 微信图标 | ⚠️ 缺失 |
| `icon_order_pending.png` | 待支付订单图标 | ⚠️ 缺失 |
| `icon_order_paid.png` | 已支付订单图标 | ⚠️ 缺失 |
| `icon_order_completed.png` | 已完成订单图标 | ⚠️ 缺失 |
| `icon_order_refund.png` | 退款订单图标 | ⚠️ 缺失 |

### 应用图标
- **尺寸**: 512px × 512px（推荐）
- **格式**: PNG
- **模式**: 透明或白色背景

| 文件名 | 说明 | 状态 |
|--------|------|------|
| `logo.png` | 应用Logo | ⚠️ 缺失 |

### 默认图片
- **尺寸**: 根据用途定制
- **格式**: JPG 或 PNG
- **模式**: 白色或浅灰色背景

| 文件名 | 说明 | 建议尺寸 | 状态 |
|--------|------|----------|------|
| `default_avatar.png` | 默认头像 | 200×200px | ⚠️ 缺失 |
| `default_product.png` | 默认产品图 | 750×750px | ⚠️ 缺失 |
| `default_banner.png` | 默认轮播图 | 750×320px | ⚠️ 缺失 |

## 图标设计建议

### 风格统一
- 使用线条图标（Line Icons）风格
- 线条粗细：2-3px
- 圆角处理：4-6px

### 颜色规范
- 未选中状态：`#999999`
- 选中状态：`#07c160`（主题绿）
- 特殊强调：`#fa5151`（红色）

### 占位图标说明

如果暂时没有设计好的图标，可以使用以下方式：

1. **使用微信小程序默认图标**
   ```json
   "iconPath": "images/icon_home.png"
   ```
   改为使用 base64 或网络图片

2. **使用 iconfont 图标库**
   - 访问 [iconfont.cn](https://www.iconfont.cn/)
   - 下载 PNG 格式图标
   - 放入 images 目录

3. **使用 AI 生成图标**
   - 使用 ChatGPT、Midjourney 等工具生成
   - 或者使用在线图标生成器

## 快速开始

### 方式一：使用默认占位图
在开发阶段，可以使用纯色块或文字占位：
```xml
<view class="icon-placeholder">首页</view>
```

### 方式二：使用 CDN 图标
引用在线图标库：
```xml
<image src="https://cdn.example.com/icon.png" mode="aspectFit" />
```

### 方式三：使用 SVG 转换
1. 从 [iconfont](https://www.iconfont.cn/) 下载 SVG
2. 使用工具转换为 PNG
3. 放入 images 目录

## 更新日志

- 2026-01-13: 创建图片资源说明文档

---

**注意**: 本目录仅作为参考，实际使用时请根据设计稿调整图片尺寸和命名。
