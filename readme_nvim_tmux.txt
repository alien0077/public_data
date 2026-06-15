tmux & nvim 設定搬遷指南
========================

== 打包（本機執行）==

tar czf ~/nvim-tmux-backup.tar.gz \
  ~/.config/tmux/ \
  ~/.config/nvim/ \
  ~/.tmux/ \
  ~/install-tmux.sh

== 解壓（公司新機器）==

tar xzf nvim-tmux-backup.tar.gz -C ~

== 一鍵安裝（推薦）==

chmod +x ~/install-tmux.sh
~/install-tmux.sh

== 手動安裝 ==

1. 備份現有設定
   mv ~/.config/tmux ~/.config/tmux.backup

2. 解壓設定檔
   tar xzf nvim-tmux-backup.tar.gz -C ~

3. 建立 symlink
   ln -s -f ~/.config/tmux/oh-my-tmux/.tmux.conf ~/.config/tmux/tmux.conf

4. 安裝 TPM（如果還沒安裝）
   git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm

5. 啟動 tmux 並安裝插件
   tmux
   Ctrl+b I

== Neovim ==

首次執行 nvim 時 lazy.nvim 會自動安裝所有插件，無需手動操作。

== Tmux 配置說明 ==

=== 狀態列 ===
使用 Oh My Tmux 框架，搭配 Powerline 箭頭風格。

左側：
  - 第1欄（黃色）: Session 名稱
  - 第2欄（粉色）: 運行時間（uptime）

右側：
  - 時間（%R）
  - 日期（%d %b）
  - 用戶名
  - 主機名

=== 導航鍵 ===
  Ctrl+b n     = 下一個窗口
  Ctrl+b p     = 上一個窗口
  Ctrl+b h/j/k/l = 切換面板
  Ctrl+b Ctrl+h/l = 切換窗口（Oh My Tmux 預設）
  Alt+Left/Right = 切換窗口（無需 prefix）

=== 自訂設定 ===
所有自訂設定都在 ~/.config/tmux/tmux.conf.local
請勿修改 ~/.config/tmux/tmux.conf（這是 Oh My Tmux 的主設定）

=== 常用操作 ===
  Ctrl+b c     = 新建窗口
  Ctrl+b ,     = 重新命名窗口
  Ctrl+b d     = 離開 tmux
  Ctrl+b %     = 垂直分割面板
  Ctrl+b "     = 水平分割面板
  Ctrl+b z     = 最大化/還原面板
  Ctrl+b [     = 進入複製模式

== 只搬 statusbar 設定 ==

若只需要 lualine statusbar，複製此檔即可（需目標機器已有 LazyVim 基礎設定）：

  ~/.config/nvim/lua/plugins/lualine.lua

== 疑難排解 ==

Q: 看不到 Powerline 箭頭？
A: 需要安裝 Nerd Font，推薦 MesloLGL Nerd Font。
   下載: https://github.com/ryanoasis/nerd-fonts/releases

Q: 狀態列顏色不對？
A: 編輯 ~/.config/tmux/tmux.conf.local 調整顏色設定

Q: 如何還原預設？
A: 刪除 ~/.config/tmux 目錄，重新解壓設定檔
