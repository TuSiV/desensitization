# 文件脱敏处理工具 (Document Desensitization Tool)

基于 Tauri 框架打造的跨平台文档脱敏处理工具，能够帮助您快速、本地地去除或处理文档中的隐私与敏感信息。完全本地化的处理能力确保了您的数据安全。

## ✨ 特性

- **支持多种格式**：采用 `mammoth.js` 和 `jszip.js`，精准解析 `.docx` 等常见文档格式。
- **多维度脱敏提取**：无论是手机号、邮箱、身份证号，还是姓名、地址、日期、金额、组织机构代码、统一社会信用代码等多种维度的隐私和敏感数据，都能高效脱敏。
- **自定义脱敏规则**：可自由增删脱敏类型，替换成特定的占位符（例如：`***`）。
- **跨平台支持**：支持打包安装至 Windows 与 macOS 环境。
- **无网络依赖**：前端纯本地化解析脱敏，保障数据隐私安全，无需担心数据被上传云端。

## 📥 下载与安装

由于 APK 安装包和编译产物不随源码上传，若您只需要使用该工具，请直接在仓库的 **[Releases](../../releases)** 页面下载适用于您系统的可执行文件：

- **Windows 用户**: 下载 `文件脱敏处理工具.exe`
- **macOS 用户**: 下载 `文件脱敏处理工具.dmg`

> **隐私指南**：本项目在代码库中不包含任何与打包产物 (APK/EXE/DMG) 相关的敏感或未脱敏隐私信息，并将其加入了 `.gitignore`。

## 🚀 本地开发指引

### 环境依赖

要在此项目上进行本地开发，您需要：
1. **Node.js**: (推荐 v16 及以上版本，用于运行前端构建)
2. **Rust**: (由于使用了 Tauri 构建，请确保您的系统安装了 `cargo`)
3. **Tauri 依赖系统**: 您的环境需配置 Tauri CLI 支持。参考 [Tauri 官方环境准备文档](https://tauri.app/v1/guides/getting-started/prerequisites)。

### 启动项目

```bash
# 1. 安装项目依赖
npm install

# 2. 本地开发预览（会启动 Vite 和 Tauri 桌面客户端）
npm run dev
```

### 产物构建打包

- **构建前端静态资源**：
  ```bash
  npm run build:web
  ```
- **打包为 Windows 应用 (.exe)**：
  ```bash
  npm run build:windows
  ```
- **打包为 macOS 应用 (.dmg / .app)**：
  ```bash
  npm run build:mac
  ```
- **Android APK 构建**：
  ```bash
  npm run build:android
  ```

## 📄 开源许可证

本项目采用 [MIT License](LICENSE) 许可协议。
