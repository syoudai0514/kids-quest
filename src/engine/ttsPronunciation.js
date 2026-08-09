// ============================================================
// 子ども向け読み上げ辞書
//
// 画面では、まだ習っていない漢字を「こん虫」のように一部だけ
// ひらがなで表示することがある。そのまま日本語辞書へ渡すと、
// 「こん」＋「虫」と分解され、虫を「むし」と読んでしまう。
// 表示用の文章は変えず、音声へ渡す直前だけ自然な読みへ直す。
//
// ここは速度設定とは別の、発音の正しさを担保する辞書。新しい教材語で
// 誤読が見つかったら、まずこの辞書と回帰テストへ追加する。
// ============================================================

const PRONUNCIATION_RULES = [
  // 表示用の「かな＋漢字」表記。空白の有無どちらも許容する。
  { pattern: /こん\s*虫/g, reading: 'こんちゅう' },

  // 社会・理科の教材表記。学習前の漢字をひらがなに分けて表示するため、
  // 日本語辞書へそのまま渡すと、複合語ではなく単語の連続として読まれる。
  { pattern: /つ\s*波/g, reading: 'つなみ' },
  { pattern: /酸\s*せい/g, reading: 'さんせい' },
  { pattern: /二\s*さんか\s*炭そ/g, reading: 'にさんかたんそ' },
  { pattern: /水\s*よう液/g, reading: 'すいようえき' },
  { pattern: /しん\s*食/g, reading: 'しんしょく' },
  { pattern: /かん\s*臓/g, reading: 'かんぞう' },
  { pattern: /消防\s*しょ/g, reading: 'しょうぼうしょ' },
  { pattern: /げ水\s*しょり場/g, reading: 'げすいしょりじょう' },
  { pattern: /せいそう\s*工場/g, reading: 'せいそうこうじょう' },
  { pattern: /よう\s*[（(]\s*養\s*[）)]\s*しょくぎょぎょう/g, reading: 'ようしょくぎょぎょう' },
  { pattern: /前方後円\s*ふん/g, reading: 'ぜんぽうこうえんふん' },
  { pattern: /県庁\s*しょざい地/g, reading: 'けんちょうしょざいち' },
  { pattern: /太平洋\s*がわ/g, reading: 'たいへいようがわ' },

  // 同じ分割事故が起きやすい既存の教材語も固定する。
  { pattern: /かん\s*電池/g, reading: 'かんでんち' },
  { pattern: /けんび\s*鏡/g, reading: 'けんびきょう' },
  { pattern: /しょうか\s*管/g, reading: 'しょうかかん' },
  { pattern: /たい\s*積/g, reading: 'たいせき' },
  { pattern: /地\s*そう/g, reading: 'ちそう' },
  { pattern: /だんご\s*虫/g, reading: 'だんごむし' },
  { pattern: /家\s*ぞく/g, reading: 'かぞく' },

  // 理科・自然（子ども向け教材で頻出する複合語）
  { pattern: /昆虫/g, reading: 'こんちゅう' },
  { pattern: /水\s*じょうき/g, reading: 'すいじょうき' },
  { pattern: /水蒸気/g, reading: 'すいじょうき' },
  { pattern: /固体/g, reading: 'こたい' },
  { pattern: /液体/g, reading: 'えきたい' },
  { pattern: /気体/g, reading: 'きたい' },
  { pattern: /伝導/g, reading: 'でんどう' },
  { pattern: /対流/g, reading: 'たいりゅう' },
  { pattern: /発芽/g, reading: 'はつが' },
  { pattern: /金属/g, reading: 'きんぞく' },
  { pattern: /磁石/g, reading: 'じしゃく' },
  { pattern: /恐竜/g, reading: 'きょうりゅう' },
  { pattern: /宇宙/g, reading: 'うちゅう' },
  { pattern: /地球/g, reading: 'ちきゅう' },

  // 学習語（辞書の分割・音読みの揺れを防ぐ）
  { pattern: /書き順/g, reading: 'かきじゅん' },
  { pattern: /読み方/g, reading: 'よみかた' },
  { pattern: /漢字/g, reading: 'かんじ' },
  { pattern: /熟語/g, reading: 'じゅくご' },
  { pattern: /四捨五入/g, reading: 'ししゃごにゅう' },
  { pattern: /百分率/g, reading: 'ひゃくぶんりつ' },
  { pattern: /最小公倍数/g, reading: 'さいしょうこうばいすう' },
  { pattern: /分母/g, reading: 'ぶんぼ' },
  { pattern: /分子/g, reading: 'ぶんし' },
  { pattern: /約分/g, reading: 'やくぶん' },
  { pattern: /通分/g, reading: 'つうぶん' },
  { pattern: /割合/g, reading: 'わりあい' },
  { pattern: /同音異義語/g, reading: 'どうおんいぎご' },
  { pattern: /重箱読み/g, reading: 'じゅうばこよみ' },
  { pattern: /湯桶読み/g, reading: 'ゆとうよみ' }
]

export function applyPronunciationOverrides(text) {
  let result = String(text)
  for (const { pattern, reading } of PRONUNCIATION_RULES) {
    result = result.replace(pattern, reading)
  }
  return result
}

export { PRONUNCIATION_RULES }
