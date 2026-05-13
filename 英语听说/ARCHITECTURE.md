# 跨平台个人专属英语听力学习平台：架构与设计文档

本文档基于您“个人独享、Web 端为主（适配 iPad）、全自动化内容处理、深度集成 Gemini 3.1 Pro 及零成本运维”的核心需求，为您量身定制了这套极致轻量且高效的系统架构设计。

---

## 1. 技术栈选型（Tailored for Personal & iPad PWA）

鉴于系统为个人独享应用，我们将“零运维成本”和“数据隐私”做到极致。不再依赖传统的后端数据库，而是利用 **Google 生态（Drive + Gemini）** 作为核心后盾。

*   **前端 / 核心全栈框架**：**Next.js (App Router)** 或 **纯粹的 React (Vite) PWA**
    *   *iPad 适配*：配合 TailwindCSS 实现完美的响应式横竖屏布局。利用 PWA 技术，在 iPad Safari 中点击“添加到主屏幕”，即可获得无边框、沉浸式的原生 App 体验。
*   **媒体存储与分发**：**Google Drive API**
    *   利用您现有的 Google 账号，将本地上传的音视频、网盘导入的媒体统一存储到 Google Drive 特定目录。前端通过 API 获取媒体流的直接播放链接。
*   **持久化“数据库”**：**Google Drive JSON 同步 (File-based NoSQL)**
    *   *为什么*：既然媒体都在 Drive，生词本和 AI 缓存也存放在 Drive 中是最高效的。应用启动时，从云盘读取一个核心的 `vocabulary_and_cache.json` 文件作为内存数据库；当产生新的 AI 解析或加入生词时，将 JSON 序列化并在后台静默覆盖上传。实现了 **跨设备多端同步且永远免费**。
*   **AI 大脑与处理核心**：**Google Gemini (AI Studio) 智能路由体系**
    *   承担音视频转录、双语字幕生成与打轴、词汇解释、语法长难句解析及 Roleplay 语音对话。

---

## 2. 核心工作流（Workflow）

### 2.1 AI 模型智能路由流 (Smart Router)
为了最大化利用配额，系统实现了级联与动态路由：
- **重体力活 (字幕生成/全集总结)**：路由至 `gemini-1.5-flash`（100万 TPM，速度极快）。
- **精细化教学与语境分析**：路由至梯队 `gemini-3.1-pro` -> `gemini-2.5-pro` -> `gemini-1.5-pro` -> `gemini-1.5-flash`。当高级模型达到每日限制 (429 Error) 时，系统自动向下降级，确保可用性。

### 2.2 媒体与内容流 (Content Pipeline)
1.  用户在前端导入视频文件。
2.  通过浏览器集成的 `ffmpeg.wasm`，在本地纯前端环境中将 MP4 视频的音轨提取为极小体积的 MP3/WAV 文件。
3.  仅将提取好的音频发送给 Gemini Flash 模型生成精准的 JSON 双语字幕。
4.  将视频原文传至 Google Drive 存档供播放。

### 2.3 学习互动与 JSON 数据同步流 (Learning & Sync Flow)
1.  **应用启动**：调取 Google Drive API 下载 `vocabulary_and_cache.json`。
2.  **沉浸式查词**：点击字幕单词，立刻冻结播放并弹出 Popover。
3.  **缓存命中拦截**：如果在刚下载的 JSON 缓存中找到了该句该词的解析，直接展现，节省 API Token。如果未找到，请求 Gemini 3.1 Pro 深度解析。
4.  **后台静默上传**：将新的解析结果或用户手动点击“加入 SRS (生词本)”的数据合入内存树，静默触发 `patch/update` API 覆盖 Google Drive 的 JSON 文件。

---

## 3. Google Drive 数据结构设计 (JSON Schema)

虽然不使用关系型数据库，但 JSON 文件的结构需保证高度有序，类似 NoSQL 文档。整个 `vocabulary_and_cache.json` 大致结构如下：

```json
{
  "version": "1.0",
  "lastSyncedAt": "2024-05-13T00:00:00Z",
  "aiAnalysisCache": {
    "wordId_or_hash": {
      "word": "sample",
      "contextEn": "I just need a blood sample.",
      "contextZh": "我只需要抽个血样。",
      "analysisResult": "**精准释义**：在这里表示医用样本...\n**固定搭配**：take a blood sample...",
      "modelUsed": "gemini-3.1-pro",
      "createdAt": "2024-05-13T10:00:00Z"
    }
  },
  "srsVocabulary": {
    "word_sample": {
      "word": "sample",
      "relatedCacheIds": ["wordId_or_hash"],
      "repetitionCount": 3,
      "easinessFactor": 2.5,
      "nextReviewDate": "2024-05-15T00:00:00Z"
    }
  },
  "mediaLibrary": [
    {
      "id": "drive_file_id_123",
      "title": "Friends S01E01",
      "duration": 1320.5,
      "lastPosition": 420.2
    }
  ]
}
```

### 数据模块说明：
1. **`aiAnalysisCache` (AI 解析缓存库)**：以“单词+上下文”的哈希或复合字符串为 Key。用户遇到生词调用 AI 后，其解析的 Markdown 永久存在这里。
2. **`srsVocabulary` (艾宾浩斯生词本)**：用户的学习库，记录单词复习数据 (SuperMemo 算法因子) 和下次复习时间。
3. **`mediaLibrary` (媒体库进度)**：存放各个音视频在云盘的文件 ID 以及当前播放进度（`lastPosition`），使得 iPad 上没看完的剧集，下次在别的设备上继续播放时能够自动跳转。

---

## 4. 关键技术难点与应对

1.  **Google Drive 跨域播放**：
    Drive 的视频不能直接用 `<video src="...">` 跨域播放。需在项目中使用 Service Worker 拦截请求附加 Auth Header，或利用简单的 API 代理层。
2.  **大 JSON 文件读写冲突**：
    由于是个人独享，并发读写概率极低。使用前端内存状态管理防抖（Debounce）即可：每当单词或进度更新后，不要立即上传，等待 5 秒无新操作后再打包全量上传，兼顾性能与 API 限制。
