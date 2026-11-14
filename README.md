# PA Cafe Character Pack: ZipZipPipe《AI娘化》

[中文說明](#中文說明) | [English](#english)

---

## 中文說明

本專案是 [PA Cafe](https://dnplus.dev) 的**非營利社群擴充角色包**，把 ZipZipPipe《[AI娘化](https://www.pixiv.net/artworks/148186519)》裡的角色改編成小屋用的 Q 版角色，每個角色都含小屋的全套造型：

| 素材 | 規格 | 用途 |
| --- | --- | --- |
| 頭像 `portrait.png` | 512×512 | 名片與聊天的頭像 |
| 立繪 `standee.png` | 512×1024 透明 | 靜態全身 |
| 走路表 `walk.png` | 2048×1024，8 欄×4 列（S/W/N/E） | 在房間裡四方向走動 |
| 入座表 `seated.png` | 1024×1024，4 欄×4 列（四個斜角） | 坐下、坐定、起身 |

角色清單見 [packs/index.json](packs/index.json)，各角色的分開圖檔在 [characters/](characters/)。

### 匯入方式（一個檔）

1. 從 [packs/](packs/) 或 Release 下載想要的 `<角色>.pacafe-character.json`（一個檔已內含四種素材與署名）。
2. 登入 **PA Cafe**，打開住民設定的「外觀」，選「匯入角色包」，把檔案丟進去。
3. 確認署名與授權後按下套用。入座造型會等你在真椅子預覽上點一下確認才生效。

免費版與所有方案都能匯入，不收費。

### 版權與授權聲明（重要）

* **原始角色設計**：全部角色的原創設計屬於 **[ZipZipPipe](https://space.bilibili.com/4168597)**（[Pixiv](https://www.pixiv.net/users/18604994)）。作者在《AI娘化》原帖說明：「方便所有人取用，需要標注作者，不可商用」。
* **DeepSeek 鯨魚娘**：ZipZipPipe 基於 **[上善无形](https://space.bilibili.com/4456176)** 的原創鯨魚娘形象二次創作，並聲明遵循原作者簽署的 CC BY-NC-SA 4.0。
* **本角色包的改編**：Q 版造型、走路與入座動作由 AI 影像生成（codex CLI）依原圖改編，再以程式切圖排版，未手繪修飾。詳見 [NOTICE.md](NOTICE.md)。
* **授權協議**：本角色包內的美術素材與衍生設定檔以 **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant)**（姓名標示-非商業性-相同方式分享 4.0 國際）釋出，全文見 [LICENSE](LICENSE)。`tools/` 裡的腳本另以 MIT 授權。
* **非商業與獨立性聲明**：
  1. 本擴充包完全免費開源，**禁止任何形式的商業販售、付費解鎖或商業宣傳用途**。
  2. 本擴充包獨立於 PA Cafe 主程式之外，不隨主程式發行，僅作為用戶自訂匯入（UGC）的開源資料；不代表原作者或任何 AI 品牌對 PA Cafe 的背書或授權。
  3. 任何基於本角色包修改或衍生的作品，對外分享時須維持相同的 `CC BY-NC-SA 4.0` 授權並標註原作者。
  4. 角色名稱中的 AI 產品名僅用於指出原作所擬人化的對象，商標屬於各自的權利人。
* 原作者若希望調整署名或下架，請開 issue，會立即處理。

### 自己重新生成

需要 Node.js 與已登入的 [codex CLI](https://github.com/openai/codex)。把原圖放到 `.refs/`（不隨倉庫發佈）後：

```bash
npm install
node tools/gen.mjs deepseek      # 生成 Q 版定稿、走路四向、入座四向
node tools/pack.mjs deepseek     # 切圖、等比縮放、對齊成小屋的版型
node tools/build.mjs             # 產生 packs/*.pacafe-character.json
```

---

## English

This repository is a **non-commercial community character pack** for [PA Cafe](https://dnplus.dev). It adapts the characters of ZipZipPipe's "[AI娘化](https://www.pixiv.net/artworks/148186519)" into chibi residents, each with the cafe's full look: portrait, standee, four-direction walking sheet and four-direction seated sheet. See [packs/index.json](packs/index.json) for the roster.

### How to Import (one file)

1. Download a `<character>.pacafe-character.json` from [packs/](packs/) or the latest Release. One file holds all four images and the credits.
2. Open **PA Cafe**, go to a resident's settings, **Appearance**, and choose **Import a character pack**.
3. Check the credits and licence, then apply. The seated look waits for one tap on the real-chair preview before it is used.

Importing is free on every plan.

### Copyright & License Notice

* **Original character design**: all characters were designed by **[ZipZipPipe](https://space.bilibili.com/4168597)** ([Pixiv](https://www.pixiv.net/users/18604994)), who states on the original post that everyone may use them with attribution and not commercially.
* **DeepSeek whale girl**: ZipZipPipe's redesign of the whale girl created by **[上善无形](https://space.bilibili.com/4456176)**, under the CC BY-NC-SA 4.0 licence the original creator chose.
* **This adaptation**: the chibi look, walking and seated frames were made with AI image generation (codex CLI) from the original art and packed by script, with no hand retouching. See [NOTICE.md](NOTICE.md).
* **License**: all artwork and derived configuration files here are licensed under **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)** ([LICENSE](LICENSE)). The scripts in `tools/` are MIT.
* **Non-commercial & independence**:
  1. This pack is free and open. **Any commercial sale, paywall gating or commercial promotional use is prohibited.**
  2. It is maintained apart from the PA Cafe application and is not shipped with it; it is user-imported content and implies no endorsement or licence from the original creators or from any AI brand.
  3. Modifications and derivative works must be shared under the same `CC BY-NC-SA 4.0` licence with attribution.
  4. AI product names only identify what the original artwork personifies; trademarks belong to their owners.
* If you are an original creator and want the attribution changed or something removed, open an issue.
