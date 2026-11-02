# SNS固定画像と共有表示受入（2026-11-02）

## 実装範囲
- 絵文字拾いの実EMOJIS8種類/各8個/8×8、実shuffleを固定乱数で呼ぶ紹介盤面、最終ゲームCSSの濃茶色背景/クリーム色セル/第1ラウンド紫枠を用い1200×630画像へ再構成。実プレイヤーの画面/結果ではない。正式題字と「間違い+5秒/ヒント+45秒」は実ルールを維持。
- 表示絵文字はインストール済Noto Color Emojiの描画（SIL Open Font License 1.1）。tools/social-glyphs.jsonに出典、フォント本体は配布しない。端末固有emojiデザインとは一致しない場合がある。
- OG/Twitter画像/寸法/alt/title/説明。home/clear/retireの共有文へ `#絵文字拾い #ゲーム制作` を追加。既存訳文、今回小数2桁・罰則・URL、名前非掲載を維持。独立copy UI新設なし、X失敗時コピーdialogは維持。
- 採点/罰則/正誤/時間/ID/音/保存/参加統計/DBは変更なし。公開成果物はindex/PNG/.nojekyll、編集SVG/ツール/資料は配信しない。

## 確認
- メタデータ/2タグは16失敗→16成功のRED/GREEN。15言語home/clear/retireのURL/タグ重複なし・現結果・加重280文字内を検査。全既存テストとlocale/構文確認を実行。
- tools/share-visual.cjsはHTMLメモリ応答だけにテスト参照を追加。製品HTMLにはテストAPIを置かない。匿名保存結果12.34秒+誤答1回5秒+ヒント1回45秒=62.34秒/ランキング6234を復元。clear/retire表示のfixtureで実64セルクリアや本番送信の証明ではない。
- HTTPはHTML直接fulfill/ランキング空応答/X intent GET mock以外abort、SW/WS遮断。score/start呼出し0。実投稿や外部ゲーム操作はない。
- 新表示はChromium/WebKit各15言語×縦横×home/clear/retire=90。黒白X/44px/fullrect viewport・overflow/centerhit/fresh intent件数+1/本文一致/blockedコピー代替/結果不変を検査、PNG保存。displaynone/ancestoropacity0/overflowclip/画面外部分欠けをnegative対照とし、scrolling rootだけviewport原点扱いの3unitも維持。
- 動的CIとPNG実見は最終headで確認してPRへ記載。全ページ画像と初期viewport同時表示、モバイルWebKitとiPhone Safari実機は区別。

## 公開と戻し方
- 正式URL https://chameleonjp.codeberg.page/emojihiroi/ は維持。GitHub画像URLは既存移行先の準備で登録/共有URL切替なし。
- 限定作業branch pushで検証のみ。Pages artifact/deployはmain push限定、既存runner/権限/公開設定は変更しない。
- 本人マージ後に配信commit/PNG/OGと実機共有を確認。公開Xカード/Codeberg更新/本番機能/実機は別未確認。
- 不具合時は差分revert PR。既存名前・成績・設定を消去しない。
