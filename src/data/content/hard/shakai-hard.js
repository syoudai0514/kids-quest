// ============================================================
// むずかしいモード（Phase 2 / WP10）— しゃかい 発展内容
//
// 対象は小4〜6。中学受験でよく出る3分野を扱う:
//   地理（都道府県の特産・気候区分・工業地帯）
//   歴史（時代別の政治・人物・条約・年代）
//   公民（三権分立・選挙・国際機関）
//
// shakai.js（通常モード）と同じ固定バンク方式・length-tell対策
// （最長の誤答を必ず含める）を踏襲する。rika-hard.jsと同じ設計。
//
// 通常モードとの分離（計画書§4.2(d)）:
//   - itemKey は必ず `hard:c:...` の名前空間を使う。
//   - unitId も明示的に `hard:shakai:...` を持たせる。unitLedger() は
//     SHAKAI_UNIT_IDS_BY_GRADE などの固定リストからしか単元を集めないため、
//     ここで作る unitId は進級必須単元に一切混ざらない。
// ============================================================

// { q: 問題文, a: 正解, d: [まちがい選択肢], e: かいせつ, unit: 単元キー }
const BANK = [
  // ---- 地理 ----
  { q: '静岡県の特産品として有名な、あたたかい地域で栽培される飲み物の原料は？', a: '茶（お茶）', d: ['米', '小麦', '大豆'], e: '静岡県は茶の生産量が全国有数で、牧之原台地などが有名な産地だよ', unit: 'geography' },
  { q: '青森県の特産品として有名な果物は？', a: 'りんご', d: ['みかん', 'もも', 'ぶどう'], e: '青森県は日本一のりんごの生産地だよ', unit: 'geography' },
  { q: '愛媛県の特産品として有名な果物は？', a: 'みかん', d: ['りんご', 'もも', 'なし'], e: '愛媛県は温暖な気候をいかしてみかんの生産がさかんだよ', unit: 'geography' },
  { q: '日本海側の気候の特色として正しいのは？', a: '冬に雪や雨が多い', d: ['冬に晴れの日が多い', '一年中雨が少ない', '夏に雪が降る'], e: '日本海側は冬、大陸からの季節風が日本海の水分をふくんで雪を降らせるよ', unit: 'geography' },
  { q: '太平洋側の気候の特色として正しいのは？', a: '冬に晴れて乾燥した日が多い', d: ['冬に雪や雨が多く、くもりがち', '一年中雨が多くしめっている', '夏にとても乾燥した日が多い'], e: '太平洋側は冬、山をこえた季節風がかわいた風になるので晴れが多いよ', unit: 'geography' },
  { q: '瀬戸内の気候の特色として正しいのは？', a: '一年を通して雨が少ない', d: ['一年中雪が多くつもる', '夏だけ雨がとても多い', '台風がほとんど来ない'], e: '瀬戸内は中国山地と四国山地にはさまれ、季節風がさえぎられるので雨が少ないよ', unit: 'geography' },
  { q: '日本最大の工業出荷額をほこる工業地帯は？', a: '中京工業地帯', d: ['京浜工業地帯', '阪神工業地帯', '北九州工業地帯'], e: '中京工業地帯は自動車工業がさかんで、日本最大の出荷額があるよ', unit: 'geography' },
  { q: '中京工業地帯で特にさかんな工業は？', a: '自動車工業', d: ['せんい工業', '製紙業', '漁業'], e: '中京工業地帯には自動車会社の工場が多く集まっているよ', unit: 'geography' },
  { q: '京浜工業地帯が広がる都道府県の組み合わせは？', a: '東京都・神奈川県', d: ['大阪府・兵庫県', '愛知県・三重県', '福岡県・佐賀県'], e: '京浜工業地帯は東京都・神奈川県を中心に広がっているよ', unit: 'geography' },
  { q: '関東から九州北部にかけて、工業地帯や都市が帯のように連なる地域を何という？', a: '太平洋ベルト', d: ['日本アルプス', '瀬戸内工業地域', '首都けん'], e: '関東から九州北部にかけて、工業地帯や都市が帯のように連なっている地域を太平洋ベルトというよ', unit: 'geography' },

  // ---- 歴史 ----
  { q: '聖徳太子が定めた、役人の心構えを示したきまりは？', a: '十七条の憲法', d: ['大宝律令', '御成敗式目', '武家諸法度'], e: '聖徳太子は603年ごろ、役人の心構えを示す十七条の憲法を定めたよ', unit: 'history' },
  { q: '鎌倉幕府を開いた人物は？', a: '源頼朝', d: ['源義経', '足利尊氏', '徳川家康'], e: '源頼朝は1192年ごろ、鎌倉に幕府を開いたよ', unit: 'history' },
  { q: '室町幕府を開いた人物は？', a: '足利尊氏', d: ['源頼朝', '徳川家康', '豊臣秀吉'], e: '足利尊氏は室町幕府を開いた初代将軍だよ', unit: 'history' },
  { q: '江戸幕府を開いた人物は？', a: '徳川家康', d: ['豊臣秀吉', '織田信長', '足利尊氏'], e: '徳川家康は1603年に江戸幕府を開いたよ', unit: 'history' },
  { q: '全国を統一し、太閤検地や刀狩を行った人物は？', a: '豊臣秀吉', d: ['織田信長', '徳川家康', '足利義満'], e: '豊臣秀吉は全国を統一し、検地や刀狩を進めたよ', unit: 'history' },
  { q: '1858年、江戸幕府がアメリカと結んだ、日本に不利な条約は？', a: '日米修好通商条約', d: ['日米和親条約', '日英同盟', 'ポーツマス条約'], e: '日米修好通商条約は関税自主権が無いなど、日本に不利な内容をふくむ条約だったよ', unit: 'history' },
  { q: '明治政府が行った、藩を廃止して県を置いた改革は？', a: '廃藩置県', d: ['版籍奉還', '地租改正', '殖産興業'], e: '1871年、明治政府は廃藩置県を行い、藩を廃止して県を置いたよ', unit: 'history' },
  { q: '1889年に発布された、日本で最初の近代的な憲法は？', a: '大日本帝国憲法', d: ['日本国憲法', '十七条の憲法', '五箇条の御誓文'], e: '大日本帝国憲法は1889年に発布された、日本初の近代的な憲法だよ', unit: 'history' },
  { q: '1945年、日本が受け入れた、戦争終結のための宣言は？', a: 'ポツダム宣言', d: ['大西洋憲章', 'ヤルタ協定', 'サンフランシスコ平和条約'], e: '1945年8月、日本はポツダム宣言を受け入れて戦争を終えたよ', unit: 'history' },
  { q: '1951年に結ばれ、日本が独立を回復するきっかけとなった条約は？', a: 'サンフランシスコ平和条約', d: ['ポツダム宣言（戦争終結の宣言）', '日米安全保障条約', '日中平和友好条約'], e: '1951年のサンフランシスコ平和条約で、日本は独立を回復したよ', unit: 'history' },

  // ---- 公民 ----
  { q: '国の権力を「立法・行政・司法」の3つに分けるしくみを何という？', a: '三権分立', d: ['二院制', '地方自治', '議院内閣制'], e: '権力が一つに集中しないよう、国会・内閣・裁判所に分けるしくみを三権分立というよ', unit: 'civics' },
  { q: '法律を作る機関はどこ？', a: '国会', d: ['内閣', '裁判所', '市役所'], e: '国会は法律を作る「立法」の仕事を行う機関だよ', unit: 'civics' },
  { q: '法律にもとづいて政治を行う機関はどこ？', a: '内閣', d: ['国会', '裁判所', '天皇'], e: '内閣は法律にもとづいて実際の政治を行う「行政」の機関だよ', unit: 'civics' },
  { q: '争いごとを法律にもとづいて解決する機関はどこ？', a: '裁判所', d: ['国会', '内閣', '選挙管理委員会'], e: '裁判所は法律にもとづいて争いを解決する「司法」の機関だよ', unit: 'civics' },
  { q: '国会は「衆議院」と、もう一つ何という議院で構成される？', a: '参議院', d: ['貴族院', '元老院', '地方議会'], e: '日本の国会は衆議院と参議院の二院制だよ', unit: 'civics' },
  { q: '国民が選挙で代表者を選ぶことで政治に参加する制度を何という？', a: '選挙', d: ['裁判', '陳情', 'デモ'], e: '選挙は国民が代表者を選んで政治に参加する大切な制度だよ', unit: 'civics' },
  { q: '日本国憲法が定める国民の三大義務は、勤労の義務と、あと2つは？', a: '教育を受けさせる義務と納税の義務', d: ['選挙に行く義務と裁判を受ける義務', '結婚する義務と子どもを持つ義務', '貯金をする義務と旅行をする義務'], e: '日本国憲法の三大義務は、教育・勤労・納税の義務だよ', unit: 'civics' },
  { q: '世界の平和と安全を守るために作られた国際機関は？', a: '国際連合（国連）', d: ['世界貿易機関', '国際オリンピック委員会', '赤十字社'], e: '国際連合（国連）は世界の平和と安全を守るために作られた国際機関だよ', unit: 'civics' },
  { q: '子どもの健康や教育などを支援する国連の機関は？', a: 'ユニセフ（国連児童基金）', d: ['ユネスコ', 'WHO（世界保健機関）', 'WTO（世界貿易機関）'], e: 'ユニセフ（UNICEF）は世界中の子どもたちを支援する国連機関だよ', unit: 'civics' },
  { q: '教育・科学・文化の面で国際協力を進める国連の機関は？', a: 'ユネスコ（国連教育科学文化機関）', d: ['ユニセフ（国連児童基金）', 'WHO（世界保健機関の略）', 'IMF（国際通貨基金の略）'], e: 'ユネスコ（UNESCO）は教育・科学・文化の面で国際協力を進める機関だよ', unit: 'civics' }
]

const UNIT_LABELS = { geography: '地理', history: '歴史', civics: '公民' }
for (const item of BANK) item.unitId = `hard:shakai:${item.unit}`

export const HARD_SHAKAI_UNIT_IDS = [...new Set(BANK.map((item) => item.unitId))]
export const HARD_SHAKAI_LABELS = Object.fromEntries(Object.entries(UNIT_LABELS).map(([k, v]) => [`hard:shakai:${k}`, v]))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

const BY_Q = Object.fromEntries(BANK.map((x) => [x.q, x]))

let recentQs = []
const RECENT_MAX = 3
function pickFresh(pool, everSeen) {
  const unseen = everSeen ? pool.filter((it) => !everSeen.has(`hard:c:${it.q}`)) : []
  const source = unseen.length ? unseen : pool.filter((it) => !new Set(recentQs).has(it.q))
  const chosen = pick(source.length ? source : pool)
  recentQs = [chosen.q, ...recentQs].slice(0, RECENT_MAX)
  return chosen
}

// shakai.js と同じ「最長の誤答を必ず含める」対策（正解が単独最長になる
// 見た目のヒントを消すため）。
function build(item, cc) {
  const longestWrong = [...item.d].sort((a, b) => b.length - a.length)[0]
  const otherWrong = shuffle(item.d.filter((value) => value !== longestWrong)).slice(0, Math.max(1, cc - 2))
  const opts = shuffle([item.a, longestWrong, ...otherWrong])
  return {
    domain: 'shakai',
    unitId: item.unitId,
    skillId: item.unitId,
    type: 'choice',
    itemKey: `hard:c:${item.q}`,
    visual: { kind: 'bigtext', text: '🗾' },
    instruction: item.q,
    speak: item.q,
    answerId: item.a,
    choices: opts.map((v) => ({ id: v, label: v, speak: v })),
    answerWord: { text: item.a },
    explain: item.e
  }
}

export function generateHardShakaiQuestion(params, reviewKey = null) {
  const cc = Math.max(3, params.choiceCount || 3)
  if (reviewKey && reviewKey.startsWith('hard:c:')) {
    const it = BY_Q[reviewKey.slice(7)]
    if (it) return build(it, cc)
  }
  return build(pickFresh(BANK, params.everSeenKnowledge), cc)
}

export const HARD_SHAKAI_QUESTIONS = BANK.map((item) => item.q)
