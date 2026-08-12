// ============================================================
// 「よむ」分野のコンテンツ（ひらがな/カタカナの単語 ＋ 小1漢字）
//
// 原則（絵と言葉のマッチングなので必須）:
//   1) 絵文字は、その単語を「ぱっと見て分かる」ものだけ。
//   2) 同じ意味・同じ見た目の語は入れない（ほし/スター等の同義語禁止）。
//   3) 1つの絵文字は1つの単語だけに使う（重複禁止）。
//
// 復習キュー対応:
//   generateReadingQuestion(params, reviewKey) に 'w:ほし' / 'k:木' を
//   渡すと、その項目を答えにした問題を作る（間違えた問題の再出題）。
//   各問題は itemKey を持ち、正誤に応じてキューへ出し入れされる。
// ============================================================

export const WORDS = [
  // --- 宇宙（絵で分かるものだけ）---
  { text: 'ほし', emoji: '⭐', kana: 'hira', tier: 1, theme: 'space' },
  { text: 'つき', emoji: '🌙', kana: 'hira', tier: 1, theme: 'space' },
  { text: 'たいよう', emoji: '☀️', kana: 'hira', tier: 3, theme: 'space' },
  { text: 'ちきゅう', emoji: '🌍', kana: 'hira', tier: 4, theme: 'space' },
  { text: 'どせい', emoji: '🪐', kana: 'hira', tier: 4, theme: 'space' },
  { text: 'ロケット', emoji: '🚀', kana: 'kata', tier: 3, theme: 'space' },
  { text: 'うちゅうじん', emoji: '👽', kana: 'hira', tier: 5, theme: 'space' },
  { text: 'うちゅうひこうし', emoji: '👨‍🚀', kana: 'hira', tier: 6, theme: 'space' },
  { text: 'ぎんが', emoji: '🌌', kana: 'hira', tier: 4, theme: 'space' },
  { text: 'にじ', emoji: '🌈', kana: 'hira', tier: 2, theme: 'space' },
  { text: 'くも', emoji: '☁️', kana: 'hira', tier: 1, theme: 'space' },
  { text: 'かみなり', emoji: '⚡', kana: 'hira', tier: 4, theme: 'space' },

  // --- 恐竜（本物に見える絵文字だけ）---
  { text: 'きょうりゅう', emoji: '🦕', kana: 'hira', tier: 5, theme: 'dino' },
  { text: 'ティラノサウルス', emoji: '🦖', kana: 'kata', tier: 6, theme: 'dino' },
  { text: 'たまご', emoji: '🥚', kana: 'hira', tier: 2, theme: 'dino' },
  { text: 'ほね', emoji: '🦴', kana: 'hira', tier: 2, theme: 'dino' },
  { text: 'あしあと', emoji: '🐾', kana: 'hira', tier: 3, theme: 'dino' },
  { text: 'りゅう', emoji: '🐉', kana: 'hira', tier: 3, theme: 'dino' },

  // --- いきもの ---
  { text: 'サイ', emoji: '🦏', kana: 'kata', tier: 2, theme: 'animal' },
  { text: 'ライオン', emoji: '🦁', kana: 'kata', tier: 4, theme: 'animal' },
  { text: 'ぞう', emoji: '🐘', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'きりん', emoji: '🦒', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'へび', emoji: '🐍', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'かめ', emoji: '🐢', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'さかな', emoji: '🐟', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'とり', emoji: '🐦', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'いぬ', emoji: '🐶', kana: 'hira', tier: 1, theme: 'animal' },
  { text: 'ねこ', emoji: '🐱', kana: 'hira', tier: 1, theme: 'animal' },
  { text: 'うさぎ', emoji: '🐰', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'くま', emoji: '🐻', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'ペンギン', emoji: '🐧', kana: 'kata', tier: 4, theme: 'animal' },
  { text: 'たこ', emoji: '🐙', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'かに', emoji: '🦀', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'ねずみ', emoji: '🐭', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'うま', emoji: '🐴', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'ぶた', emoji: '🐷', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'ひつじ', emoji: '🐑', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'さる', emoji: '🐵', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'とら', emoji: '🐯', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'コアラ', emoji: '🐨', kana: 'kata', tier: 3, theme: 'animal' },
  { text: 'パンダ', emoji: '🐼', kana: 'kata', tier: 3, theme: 'animal' },
  { text: 'かえる', emoji: '🐸', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'はち', emoji: '🐝', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'ちょうちょ', emoji: '🦋', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'かたつむり', emoji: '🐌', kana: 'hira', tier: 5, theme: 'animal' },
  { text: 'くじら', emoji: '🐳', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'いるか', emoji: '🐬', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'さめ', emoji: '🦈', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'ユニコーン', emoji: '🦄', kana: 'kata', tier: 5, theme: 'animal' },

  // --- たべもの ---
  { text: 'いちご', emoji: '🍓', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'ぶどう', emoji: '🍇', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'すいか', emoji: '🍉', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'みかん', emoji: '🍊', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'りんご', emoji: '🍎', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'ばなな', emoji: '🍌', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'トマト', emoji: '🍅', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'にんじん', emoji: '🥕', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ケーキ', emoji: '🍰', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'パン', emoji: '🍞', kana: 'kata', tier: 2, theme: 'life' },
  { text: 'おにぎり', emoji: '🍙', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'アイス', emoji: '🍦', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'きのこ', emoji: '🍄', kana: 'hira', tier: 3, theme: 'life' },

  // --- のりもの ---
  { text: 'くるま', emoji: '🚗', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'でんしゃ', emoji: '🚃', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ひこうき', emoji: '✈️', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ふね', emoji: '🚢', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'じてんしゃ', emoji: '🚲', kana: 'hira', tier: 5, theme: 'life' },
  { text: 'バス', emoji: '🚌', kana: 'kata', tier: 2, theme: 'life' },
  { text: 'きゅうきゅうしゃ', emoji: '🚑', kana: 'hira', tier: 6, theme: 'life' },
  { text: 'しょうぼうしゃ', emoji: '🚒', kana: 'hira', tier: 6, theme: 'life' },

  // --- しぜん・みのまわり ---
  { text: 'みず', emoji: '💧', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'き', emoji: '🌳', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'はな', emoji: '🌸', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'やま', emoji: '⛰️', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'ゆきだるま', emoji: '⛄', kana: 'hira', tier: 5, theme: 'life' },
  { text: 'かざん', emoji: '🌋', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ひまわり', emoji: '🌻', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'サボテン', emoji: '🌵', kana: 'kata', tier: 4, theme: 'life' },

  // --- からだ ---
  { text: 'め', emoji: '👁️', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'は', emoji: '🦷', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'て', emoji: '✋', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'あし', emoji: '🦶', kana: 'hira', tier: 2, theme: 'life' },

  // --- くだもの・やさい・たべもの（増量） ---
  { text: 'もも', emoji: '🍑', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'さくらんぼ', emoji: '🍒', kana: 'hira', tier: 5, theme: 'life' },
  { text: 'パイナップル', emoji: '🍍', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'メロン', emoji: '🍈', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'レモン', emoji: '🍋', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'なし', emoji: '🍐', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'くり', emoji: '🌰', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'とうもろこし', emoji: '🌽', kana: 'hira', tier: 6, theme: 'life' },
  { text: 'なす', emoji: '🍆', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'じゃがいも', emoji: '🥔', kana: 'hira', tier: 5, theme: 'life' },
  { text: 'たまねぎ', emoji: '🧅', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ブロッコリー', emoji: '🥦', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'ハンバーガー', emoji: '🍔', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'ピザ', emoji: '🍕', kana: 'kata', tier: 2, theme: 'life' },
  { text: 'スパゲッティ', emoji: '🍝', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'カレー', emoji: '🍛', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'ラーメン', emoji: '🍜', kana: 'kata', tier: 4, theme: 'life' },
  { text: 'すし', emoji: '🍣', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'ぎょうざ', emoji: '🥟', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'プリン', emoji: '🍮', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'チョコレート', emoji: '🍫', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'クッキー', emoji: '🍪', kana: 'kata', tier: 4, theme: 'life' },
  { text: 'ドーナツ', emoji: '🍩', kana: 'kata', tier: 4, theme: 'life' },
  { text: 'あめだま', emoji: '🍬', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ポップコーン', emoji: '🍿', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'ジュース', emoji: '🧃', kana: 'kata', tier: 4, theme: 'life' },
  { text: 'ぎゅうにゅう', emoji: '🥛', kana: 'hira', tier: 6, theme: 'life' },

  // --- いきもの（増量） ---
  { text: 'きつね', emoji: '🦊', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'おおかみ', emoji: '🐺', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'しか', emoji: '🦌', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'りす', emoji: '🐿️', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'はりねずみ', emoji: '🦔', kana: 'hira', tier: 5, theme: 'animal' },
  { text: 'こうもり', emoji: '🦇', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'わに', emoji: '🐊', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'かば', emoji: '🦛', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'ゴリラ', emoji: '🦍', kana: 'kata', tier: 3, theme: 'animal' },
  { text: 'らくだ', emoji: '🐫', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'しまうま', emoji: '🦓', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'ひょう', emoji: '🐆', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'フラミンゴ', emoji: '🦩', kana: 'kata', tier: 6, theme: 'animal' },
  { text: 'くじゃく', emoji: '🦚', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'ふくろう', emoji: '🦉', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'あひる', emoji: '🦆', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'にわとり', emoji: '🐔', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'ひよこ', emoji: '🐤', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'てんとうむし', emoji: '🐞', kana: 'hira', tier: 6, theme: 'animal' },
  { text: 'あり', emoji: '🐜', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'えび', emoji: '🦐', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'いか', emoji: '🦑', kana: 'hira', tier: 2, theme: 'animal' },

  // --- どうぐ・もちもの ---
  { text: 'ふうせん', emoji: '🎈', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'プレゼント', emoji: '🎁', kana: 'kata', tier: 5, theme: 'life' },
  { text: 'とけい', emoji: '⏰', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'めがね', emoji: '👓', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'ぼうし', emoji: '🎩', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'くつ', emoji: '👟', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'かさ', emoji: '☂️', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'ランドセル', emoji: '🎒', kana: 'kata', tier: 5, theme: 'life' },
  { text: 'えんぴつ', emoji: '✏️', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'はさみ', emoji: '✂️', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'かぎ', emoji: '🔑', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'いす', emoji: '🪑', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'ベッド', emoji: '🛏️', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'でんわ', emoji: '📞', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'カメラ', emoji: '📷', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'テレビ', emoji: '📺', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'ロボット', emoji: '🤖', kana: 'kata', tier: 4, theme: 'space' },
  { text: 'ピアノ', emoji: '🎹', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'ギター', emoji: '🎸', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'たいこ', emoji: '🥁', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'サッカーボール', emoji: '⚽', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'やきゅう', emoji: '⚾', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'メダル', emoji: '🥇', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'トロフィー', emoji: '🏆', kana: 'kata', tier: 5, theme: 'life' },

  // --- のりもの・たてもの（増量） ---
  { text: 'ヨット', emoji: '⛵', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'ヘリコプター', emoji: '🚁', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'トラクター', emoji: '🚜', kana: 'kata', tier: 5, theme: 'life' },
  { text: 'パトカー', emoji: '🚓', kana: 'kata', tier: 4, theme: 'life' },
  { text: 'タクシー', emoji: '🚕', kana: 'kata', tier: 4, theme: 'life' },
  { text: 'トラック', emoji: '🚚', kana: 'kata', tier: 4, theme: 'life' },
  { text: 'しんかんせん', emoji: '🚅', kana: 'hira', tier: 6, theme: 'life' },
  { text: 'きかんしゃ', emoji: '🚂', kana: 'hira', tier: 5, theme: 'life' },
  { text: 'おしろ', emoji: '🏰', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'テント', emoji: '⛺', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'びょういん', emoji: '🏥', kana: 'hira', tier: 5, theme: 'life' },
  { text: 'がっこう', emoji: '🏫', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'かんらんしゃ', emoji: '🎡', kana: 'hira', tier: 6, theme: 'life' },
  { text: 'ジェットコースター', emoji: '🎢', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'メリーゴーランド', emoji: '🎠', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'はなび', emoji: '🎆', kana: 'hira', tier: 3, theme: 'life' },

  // --- いきもの（さらに増量） ---
  { text: 'あざらし', emoji: '🦭', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'なまけもの', emoji: '🦥', kana: 'hira', tier: 5, theme: 'animal' },
  { text: 'かわうそ', emoji: '🦦', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'あなぐま', emoji: '🦡', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'はくちょう', emoji: '🦢', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'はと', emoji: '🕊️', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'やぎ', emoji: '🐐', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'マンモス', emoji: '🦣', kana: 'kata', tier: 5, theme: 'dino' },
  { text: 'ロブスター', emoji: '🦞', kana: 'kata', tier: 5, theme: 'animal' },
  { text: 'ふぐ', emoji: '🐡', kana: 'hira', tier: 2, theme: 'animal' },
  { text: 'ねったいぎょ', emoji: '🐠', kana: 'hira', tier: 5, theme: 'animal' },
  { text: 'さそり', emoji: '🦂', kana: 'hira', tier: 3, theme: 'animal' },
  { text: 'いもむし', emoji: '🐛', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'こおろぎ', emoji: '🦗', kana: 'hira', tier: 4, theme: 'animal' },
  { text: 'ビーバー', emoji: '🦫', kana: 'kata', tier: 4, theme: 'animal' },

  // --- たべもの（さらに増量） ---
  { text: 'やきいも', emoji: '🍠', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'キウイ', emoji: '🥝', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'アボカド', emoji: '🥑', kana: 'kata', tier: 4, theme: 'life' },
  { text: 'ピーマン', emoji: '🫑', kana: 'kata', tier: 4, theme: 'life' },
  { text: 'きゅうり', emoji: '🥒', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'サンドイッチ', emoji: '🥪', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'フライドポテト', emoji: '🍟', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'ホットドッグ', emoji: '🌭', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'タコス', emoji: '🌮', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'パンケーキ', emoji: '🥞', kana: 'kata', tier: 5, theme: 'life' },
  { text: 'めだまやき', emoji: '🍳', kana: 'hira', tier: 5, theme: 'life' },
  { text: 'だんご', emoji: '🍡', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'かきごおり', emoji: '🍧', kana: 'hira', tier: 5, theme: 'life' },
  { text: 'マンゴー', emoji: '🥭', kana: 'kata', tier: 4, theme: 'life' },
  { text: 'はちみつ', emoji: '🍯', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'カップケーキ', emoji: '🧁', kana: 'kata', tier: 5, theme: 'life' },

  // --- しぜん・もちもの・あそび（さらに増量） ---
  { text: 'チューリップ', emoji: '🌷', kana: 'kata', tier: 5, theme: 'life' },
  { text: 'ばら', emoji: '🌹', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'よつば', emoji: '🍀', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'もみじ', emoji: '🍁', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'なみ', emoji: '🌊', kana: 'hira', tier: 2, theme: 'space' },
  { text: 'ゆき', emoji: '❄️', kana: 'hira', tier: 2, theme: 'space' },
  { text: 'ダイヤ', emoji: '💎', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'クレヨン', emoji: '🖍️', kana: 'kata', tier: 4, theme: 'life' },
  { text: 'ほん', emoji: '📚', kana: 'hira', tier: 2, theme: 'life' },
  { text: 'ぬいぐるみ', emoji: '🧸', kana: 'hira', tier: 5, theme: 'life' },
  { text: 'さいころ', emoji: '🎲', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'パズル', emoji: '🧩', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'ヨーヨー', emoji: '🪀', kana: 'kata', tier: 3, theme: 'life' },
  { text: 'でんきゅう', emoji: '💡', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'じしゃく', emoji: '🧲', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'ながれぼし', emoji: '🌠', kana: 'hira', tier: 5, theme: 'space' },
  { text: 'ユーフォー', emoji: '🛸', kana: 'kata', tier: 4, theme: 'space' },
  { text: 'バスケットボール', emoji: '🏀', kana: 'kata', tier: 6, theme: 'life' },
  { text: 'たっきゅう', emoji: '🏓', kana: 'hira', tier: 4, theme: 'life' },
  { text: 'かぼちゃ', emoji: '🎃', kana: 'hira', tier: 3, theme: 'life' },
  { text: 'みみ', emoji: '👂', kana: 'hira', tier: 1, theme: 'life' },
  { text: 'ゆび', emoji: '👆', kana: 'hira', tier: 2, theme: 'life' }
]

import { kanjiPoolForGrade, KANJI_BY_CHAR, jukugoPoolForGrade, JUKUGO_BY_WORD } from '../kanjiByGrade.js'
import { generateLanguageQuestion, generateDokkaiQuestion } from './readingLanguage.js'

// WP2: 語彙・文法系の新形式は itemKey の接頭辞で判別する。
const LANGUAGE_PREFIXES = ['idiom:', 'proverb:', 'yoji:', 'anto:', 'syno:', 'homo:', 'bushu:', 'okuri:', 'bunpo:', 'keigo:']

const WORD_BY_TEXT = Object.fromEntries(WORDS.map((w) => [w.text, w]))

// 学年ぶんの最低むずかしさ。これが無いと、アダプティブの習熟度
//（学年ごとに独立管理・新しい学年では START_LEVEL から再スタート）
// だけで単語の難易度が決まってしまい、たとえば小4でも「ぞう」のような
// 年長〜小1向けの簡単な単語が普通に出題対象に入ってしまっていた。
function minTierForGrade(grade) {
  if (grade <= 1) return 1
  if (grade === 2) return 2
  if (grade === 3) return 3
  if (grade === 4) return 3
  return 4 // 小5・小6
}

function poolForLevel(level, allowKatakana, allowHard, grade = 0) {
  const floor = minTierForGrade(grade)
  // 天井（level+1）が フロアを下回ると 該当tierが1つも無くなり、
  // 呼び出し側の「プールが小さすぎたら 無フィルタの WORDS 全体へ
  // フォールバック」が発動して フロアごと無視されてしまう。
  // 天井を フロア以上に 底上げして、その事故を防ぐ。
  const ceil = Math.max(level + 1, floor)
  return WORDS.filter((w) => {
    if (!allowKatakana && w.kana === 'kata') return false
    if (!allowHard && w.tier >= 5) return false
    if (w.tier < floor) return false
    return w.tier <= ceil
  })
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 一度も出したことのない項目を最優先する（未出優先）。everSeen は
// ActivityPlayer が state.srs['yomu'] の既存キーから渡す「既出」集合。
// 全部見たことがあれば従来どおり完全ランダムに戻る。
function pickUnseenFirst(pool, everSeen, keyOf) {
  if (everSeen) {
    const unseen = pool.filter((item) => !everSeen.has(keyOf(item)))
    if (unseen.length) return shuffle(unseen)[0]
  }
  return shuffle(pool)[0]
}

// 正解と「文字も絵文字も」かぶらないダミーを選ぶ
function pickDistinct(pool, n, exclude) {
  const seenEmoji = new Set([exclude.emoji])
  const out = []
  for (const w of shuffle(pool)) {
    if (out.length >= n - 1) break
    if (w.text === exclude.text) continue
    if (seenEmoji.has(w.emoji)) continue
    seenEmoji.add(w.emoji)
    out.push(w)
  }
  return out
}

const THEME_LABEL = {
  space: 'うちゅうの なかま',
  dino: 'きょうりゅうの なかま',
  animal: 'どうぶつの なかま',
  life: 'せいかつの なかま'
}

function wordQuestion(answer, params) {
  const { level, choiceCount, allowKatakana, allowHard, grade } = params
  const pool = poolForLevel(level, allowKatakana, allowHard, grade)
  const safePool = pool.length >= choiceCount ? pool : WORDS
  const distractors = pickDistinct(safePool, choiceCount, answer)
  const options = shuffle([answer, ...distractors])
  const mode = Math.random() < 0.5 ? 'pick-word' : 'pick-pic'

  if (mode === 'pick-pic') {
    return {
      domain: 'yomu',
      type: 'choice',
      itemKey: `w:${answer.text}`,
      visual: { kind: 'word', text: answer.text },
      speak: `${answer.text}。 ${answer.text}は どれかな？`,
      instruction: 'おなじ えを えらんでね',
      answerId: answer.text,
      choices: options.map((w) => ({ id: w.text, emoji: w.emoji })),
      answerWord: answer,
      explain: `こたえは これ。「${answer.text}」の えだよ。${THEME_LABEL[answer.theme] || 'ことば'}だね`
    }
  }
  return {
    domain: 'yomu',
    type: 'choice',
    itemKey: `w:${answer.text}`,
    visual: { kind: 'emoji', emoji: answer.emoji },
    speak: 'これは なにかな？ ことばを えらんでね',
    instruction: 'これは なに？',
    answerId: answer.text,
    choices: options.map((w) => ({ id: w.text, label: w.text, speak: w.text })),
    answerWord: answer,
    explain: `これは「${answer.text}」。${THEME_LABEL[answer.theme] || 'ことば'}だよ。さいしょの もじは「${answer.text[0]}」`
  }
}

function kanjiQuestion(answer, params) {
  const { choiceCount } = params
  const pool = kanjiPoolForGrade(params.grade || 0)
  const seen = new Set([answer.yomi])
  const distractors = []
  for (const k of shuffle(pool)) {
    if (distractors.length >= choiceCount - 1) break
    if (seen.has(k.yomi)) continue
    seen.add(k.yomi)
    distractors.push(k)
  }
  const options = shuffle([answer, ...distractors])
  return {
    domain: 'yomu',
    type: 'choice',
    itemKey: `k:${answer.k}`,
    visual: { kind: 'kanji', text: answer.k },
    speak: 'この かんじは なんて よむかな？',
    instruction: 'なんて よむ？',
    answerId: answer.yomi,
    choices: options.map((k) => ({ id: k.yomi, label: k.yomi, speak: k.yomi })),
    answerWord: { text: answer.yomi },
    explain: `この かんじは 「${answer.yomi}」と よむよ`
  }
}

// 熟語（2字）: 「なんて よむ？」
function jukugoQuestion(answer, params) {
  const { choiceCount } = params
  const pool = jukugoPoolForGrade(Math.max(1, params.grade || 1))
  const seen = new Set([answer.yomi])
  const distractors = []
  for (const j of shuffle(pool)) {
    if (distractors.length >= choiceCount - 1) break
    if (seen.has(j.yomi)) continue
    seen.add(j.yomi)
    distractors.push(j)
  }
  const options = shuffle([answer, ...distractors])
  return {
    domain: 'yomu',
    type: 'choice',
    itemKey: `j:${answer.k}`,
    visual: { kind: 'kanji', text: answer.k },
    speak: 'この ことばは なんて よむかな？',
    instruction: 'なんて よむ？',
    answerId: answer.yomi,
    choices: options.map((j) => ({ id: j.yomi, label: j.yomi, speak: j.yomi })),
    answerWord: { text: answer.yomi },
    explain: `これは 「${answer.yomi}」と よむよ`
  }
}

/**
 * 「よむ」の問題を1問生成する。
 * @param {object} params 難易度パラメータ
 * @param {string|null} reviewKey 'w:ことば' | 'k:字' | 'idiom:...' など（復習したい項目）
 */
export function generateReadingQuestion(params, reviewKey = null) {
  // 復習キューからの再出題
  if (reviewKey) {
    if (reviewKey.startsWith('j:')) {
      const j = JUKUGO_BY_WORD[reviewKey.slice(2)]
      if (j) return jukugoQuestion(j, params)
    }
    if (reviewKey.startsWith('k:')) {
      // 旧セーブの裸漢字は、送り仮名や文脈のある熟語へ移行する。
      const char = reviewKey.slice(2)
      const example = jukugoPoolForGrade(Math.max(1, params.grade || 1)).find((j) => j.k.includes(char))
      if (example) return jukugoQuestion(example, params)
    } else if (reviewKey.startsWith('w:')) {
      const w = WORD_BY_TEXT[reviewKey.slice(2)]
      if (w) return wordQuestion(w, params)
    } else if (reviewKey.startsWith('dokkai:')) {
      return generateDokkaiQuestion(params, reviewKey)
    } else if (LANGUAGE_PREFIXES.some((prefix) => reviewKey.startsWith(prefix))) {
      return generateLanguageQuestion(params, reviewKey)
    }
  }

  const everSeen = params.everSeenKnowledge

  // 単元導入・しれんでは、指定された種類から外さない。
  if (String(params.unitId || '').endsWith(':kanji-words')) {
    const jpool = jukugoPoolForGrade(Math.max(1, params.grade || 1))
    if (jpool.length) return jukugoQuestion(pickUnseenFirst(jpool, everSeen, (j) => `j:${j.k}`), params)
  }
  if (String(params.unitId || '').endsWith(':kana-words')) {
    const pool = poolForLevel(params.level, params.allowKatakana, params.allowHard, params.grade || 0)
    const safePool = pool.length >= params.choiceCount ? pool : WORDS
    return wordQuestion(pickUnseenFirst(safePool, everSeen, (w) => `w:${w.text}`), params)
  }
  if (String(params.unitId || '').endsWith(':language')) return generateLanguageQuestion(params)
  if (String(params.unitId || '').endsWith(':dokkai')) return generateDokkaiQuestion(params)

  // 漢字は必ず熟語で出す。裸の一字に語全体の読みを答えさせない。
  const grade = params.grade || 0
  const kanjiProb = grade >= 2 ? 0.65 : grade === 1 ? 0.45 : params.level >= 3 ? 0.35 : 0
  const jpool = grade >= 1 ? jukugoPoolForGrade(grade) : []
  const pool = poolForLevel(params.level, params.allowKatakana, params.allowHard, grade)
  const safePool = pool.length >= params.choiceCount ? pool : WORDS

  // 未出優先のときは、熟語・単語のどちらが先に「一巡」したかで出現確率
  // (kanjiProb) を上書きしない。片方だけ未出が残っているなら、その未出を
  // 優先する（そうしないと、先に一巡した側だけ既出の再出題が始まり、
  // もう片方に未出があっても「未出優先」が守られない）。
  if (everSeen) {
    const jUnseen = jpool.filter((j) => !everSeen.has(`j:${j.k}`))
    const wUnseen = safePool.filter((w) => !everSeen.has(`w:${w.text}`))
    if (jUnseen.length && (!wUnseen.length || Math.random() < kanjiProb)) return jukugoQuestion(shuffle(jUnseen)[0], params)
    if (wUnseen.length) return wordQuestion(shuffle(wUnseen)[0], params)
    // 両方すでに一巡済み。ここから先は従来どおり確率で選ぶ通常運用。
  }
  if (Math.random() < kanjiProb && jpool.length) return jukugoQuestion(shuffle(jpool)[0], params)
  return wordQuestion(shuffle(safePool)[0], params)
}
