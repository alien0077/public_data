使用繁體中文做全程討論。

## 個人 AI 知識庫
你擁有 `wiki` MCP 工具，可以搜尋和讀取我的個人知識庫（位於 `/Users/alien/Desktop/Obisidian/wiki/`）。
- 需要查閱知識時，先使用 `wiki` 的 `query` 工具搜尋相關頁面，再用 `get` 工具讀取完整內容
- 引用來源時使用 Obsidian 格式 `[[PageName]]`
- 如果搜尋不到，透過 `status` 工具檢查索引狀態

## 寫入知識庫
當我要求「把這個加入知識庫」「存到 wiki」「記錄下來」時：
1. 在 `/Users/alien/Desktop/Obisidian/wiki/` 建立適當的概念/實體/綜合分析頁面
2. 使用 `[[Page @type]]` 類型化連結與現有頁面交叉引用
3. 更新 `wiki/index.md` 和 `wiki/log.md`
4. 執行 `export PATH="$HOME/.npm-global/bin:$PATH" && qmd update && qmd embed` 重新索引
5. 告知我寫入完成

## 素材編譯 `/ingest`
當我要求 `/ingest <路徑>` 時，代表要從 `raw/` 的原始素材編譯到知識庫：
1. 讀取指定原始檔，與我討論重點
2. 在 `wiki/sources/` 建立來源摘要
3. 更新或建立相關的 `wiki/concepts/` 和 `wiki/entities/` 頁面
4. 使用 `[[Page @type]]` 類型化連結
5. 更新 `wiki/index.md` 和 `wiki/log.md`
6. 執行 `export PATH="$HOME/.npm-global/bin:$PATH" && qmd update && qmd embed` 重新索引
7. 將原始檔移至 `raw/09-archive/`
<!-- handoff -->
## Handoff — Session 交接

### 新 Session 啟動時
第一步先檢查專案根目錄是否有 `handoff.md`，可執行：
```bash
.agents/skills/handoff/scripts/detect_handoff.sh
```
若回傳 `HANDOFF_DETECTED`，讀取 handoff.md 後恢復工作。

### 產出 Handoff 時機
- context 明顯過長、頻繁遺忘早期對話時，**主動詢問**是否要產
- 使用者說 `/handoff` 或「做交接」
- 完成一個完整 task 且有後續依賴工作時
- 產出至 `<project_root>/handoff.md`，遵循 `.agents/skills/handoff/reference/handoff_template.md`
<!-- context7 -->
Use Context7 MCP to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service -- even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer -- your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

## Steps

1. Always start with `resolve-library-id` using the library name and the user's question, unless the user provides an exact library ID in `/org/project` format
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question). Use version-specific IDs when the user mentions a version
3. `query-docs` with the selected library ID and the user's full question (not single words)
4. Answer using the fetched docs
<!-- context7 -->
