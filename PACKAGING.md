# 跨平台封装说明（Windows / macOS / Android）

## 1. 环境准备

- Node.js 20+（已用于脚本）
- Rust 工具链（`rustup`）
- Tauri 依赖环境（按官方文档安装）
- Android 打包需要：
  - Android Studio
  - Android SDK / NDK
  - Java 17

## 2. 安装依赖

```bash
npm install
```

## 3. 开发调试

```bash
npm run dev
```

## 4. 生成桌面安装包

- Windows (`.exe`, NSIS):

```bash
npm run build:windows
```

- macOS (`.app` + `.dmg`):

```bash
npm run build:mac
```

- 同时构建当前平台可用目标:

```bash
npm run build:desktop
```

产物目录（默认）：

- `src-tauri/target/release/bundle/nsis/`
- `src-tauri/target/release/bundle/dmg/`
- `src-tauri/target/release/bundle/macos/`

## 5. 生成 Android 安装包

首次初始化：

```bash
npm run android:init
```

生成 APK：

```bash
npm run build:android
```

常见产物目录：

- `src-tauri/gen/android/app/build/outputs/apk/`

## 6. 体积优化（已启用）

- 前端只打包最小资源集到 `dist/`（`index.html` + 2 个运行时依赖）
- Rust `release` 配置启用：
  - `lto = true`
  - `opt-level = "s"`
  - `strip = true`
  - `panic = "abort"`
- 未启用自动更新产物（`createUpdaterArtifacts = false`）

## 7. 功能符合性

- 拖拽上传：保留原有逻辑（桌面端可直接拖拽文件）
- 导出地址可选：
  - 选择保存路径（优先）
  - 默认下载目录（可切换）
