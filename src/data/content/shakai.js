// ============================================================
// 「しゃかい（社会）」分野 — 小3〜小6
//
// 学習指導要領の学年配当:
//   小3: 地図記号 / 市のようす / 店の仕事 / 昔の道具 / 消防・警察
//   小4: 都道府県 / ごみと水 / 自然災害 / 地図の見方
//   小5: 日本の国土 / 農業・水産業 / 工業 / 情報 / 森林
//   小6: 歴史（縄文〜現代）/ 政治・憲法 / 国際
//
// 事実の正確さを最優先。年号や制度は確実なものだけ。
// ============================================================

const BANK = {
  3: [
    { q: '地図記号「⛩」は 何を あらわす？', a: 'じんじゃ', d: ['お寺', 'がっこう', 'ゆうびんきょく'], e: 'とりいの 形から じんじゃを あらわすよ' },
    { q: '地図記号「〒」は 何を あらわす？', a: 'ゆうびんきょく', d: ['けいさつしょ', 'びょういん', 'こうえん'], e: 'ゆうびんの マークから できた 記号だよ' },
    { q: '地図で 学校を あらわす 記号は？', a: '文', d: ['〒', '⛩', '卍'], e: '「文」の字は 学校を あらわすよ' },
    { q: '地図記号「卍」は 何を あらわす？', a: 'お寺', d: ['じんじゃ', 'こうばん', 'びょういん'], e: '卍は お寺を あらわす 記号だよ' },
    { q: '火事の とき よぶ 電話ばんごうは？', a: '119ばん', d: ['110ばん', '117ばん', '911ばん'], e: '火事・きゅうきゅうは 119ばん、じけん・じこは 110ばんだよ' },
    { q: 'どろぼうや じこの とき よぶ 電話ばんごうは？', a: '110ばん', d: ['119ばん', '118ばん', '104ばん'], e: 'けいさつは 110ばんだよ' },
    { q: 'スーパーマーケットで 品物の ねだんや 産地が 書いて あるものは？', a: 'ねふだ（ラベル）', d: ['レシート', 'ちらし', 'かんばん'], e: 'ねふだを 見ると どこで つくられたか わかるよ' },
    { q: '昔、ごはんを たく のに つかった 道具は？', a: 'かまど', d: ['電子レンジ', 'れいぞうこ', 'せんたくき'], e: '昔は まきを もやして かまどで ごはんを たいたよ' },
    { q: '昔、せんたくに つかった 道具は？', a: 'せんたく板', d: ['そうじき', 'アイロン', 'ミシン'], e: 'せんたく板で こすって あらったよ' },
    { q: '消防しょで はたらく 人は？', a: '消防士', d: ['けいさつかん', 'いしゃ', 'うんてんしゅ'], e: '消防士が 火を けしたり 人を たすけたり するよ' },
    { q: '町の 中で 安全を まもる ため けいさつかんが いる 小さな しせつは？', a: 'こうばん', d: ['市やくしょ', 'としょかん', 'ゆうびんきょく'], e: 'こうばんは 町の 中に あって、みまわりも するよ' },
    { q: 'スーパーマーケットが 品物を ならべる ときに 大切にすることは？', a: 'お客さんが 見つけやすく 買いやすいこと', d: ['品物を すべて かくすこと', 'ねだんを 書かないこと', '同じ品物を 店の外だけに置くこと'], e: '店は、表示や並べ方を工夫して、お客さんが選びやすくしているよ' }
  ],
  4: [
    { q: '日本の 都道府県は いくつ？', a: '47', d: ['43', '50', '39'], e: '1都(東京)・1道(北海道)・2府(大阪・京都)・43県で 47だよ' },
    { q: '日本で いちばん 大きい 都道府県は？', a: '北海道', d: ['岩手県', '福島県', '長野県'], e: '北海道が いちばん 広いよ' },
    { q: '大阪府庁が ある 市は？', a: '大阪市', d: ['堺市', '神戸市', '京都市'], e: '大阪府庁は 大阪市に あるよ' },
    { q: '愛知県の 県庁しょざい地は？', a: '名古屋市', d: ['豊田市', '岡崎市', '静岡市'], e: '愛知県の 県庁は 名古屋市に あるよ' },
    { q: '神奈川県の 県庁しょざい地は？', a: '横浜市', d: ['川崎市', '鎌倉市', '相模原市'], e: '神奈川県の 県庁は 横浜市に あるよ' },
    { q: 'もえるごみを もやす しせつを 何という？', a: 'せいそう工場（ごみしょり場）', d: ['じょう水場', 'げ水しょり場', 'はつでん所'], e: 'せいそう工場で もやして、はいは うめ立てるよ' },
    { q: '川の 水を きれいに して 水道に おくる しせつは？', a: 'じょう水場', d: ['げ水しょり場', 'ダム', 'せいそう工場'], e: 'じょう水場で きれいに してから 家に とどくよ' },
    { q: 'つかった あとの 水を きれいに する しせつは？', a: 'げ水しょり場', d: ['じょう水場', 'ダム', 'ポンプ場'], e: 'よごれた 水は げ水しょり場で きれいに してから 川へ もどすよ' },
    { q: '地しんの とき 海から くる 大きな 波を 何という？', a: 'つ波', d: ['たいふう', 'こうずい', 'なだれ'], e: 'つ波は 高い ところへ にげるのが 大事だよ' },
    { q: 'ひなん場所や きけんな 場所が 書いて ある 地図を 何という？', a: 'ハザードマップ', d: ['天気図', '地球ぎ', '路線図'], e: 'ハザードマップで 前もって かくにん して おこう' },
    { q: '地図で 北は ふつう どちら？', a: '上', d: ['下', '右', '左'], e: '地図は ふつう 上が 北だよ' },
    { q: '地図の しゅくしゃくは 何を あらわす？', a: '地図の長さと じっさいの長さの 関係', d: ['土地の 高さだけ', '人の 数だけ', '天気の かわり方'], e: '縮尺を見ると、地図上の長さから実際の距離を求められるよ' }
  ],
  5: [
    { q: '日本の まわりに ある 海で、東がわに 広がるのは？', a: '太平洋', d: ['日本海', 'オホーツク海', '東シナ海'], e: '日本の 東は 太平洋、西は 日本海だよ' },
    { q: '日本で いちばん 高い 山は？', a: '富士山', d: ['北岳', '御嶽山', '立山'], e: '富士山は 3776mで 日本一だよ' },
    { q: '日本で いちばん 長い 川は？', a: '信濃川', d: ['利根川', '石狩川', '北上川'], e: '信濃川が いちばん 長く、利根川は りゅういき面積が 日本一' },
    { q: '日本の 国土の やく 3分の2を しめる ものは？', a: '森林', d: ['田や畑', '住たく地', '湖'], e: '日本は 森林が 多い 国だよ' },
    { q: '米づくりが さかんな 地方は？', a: '東北地方', d: ['沖縄県', '四国の 山地', '東京都心'], e: '雪どけ水と 広い へいやで 東北は 米づくりが さかん' },
    { q: '魚を たまごから そだてて 大きくして とる ぎょぎょうを 何という？', a: 'よう(養)しょくぎょぎょう', d: ['遠洋ぎょぎょう', '沿岸ぎょぎょう', 'おきあいぎょぎょう'], e: 'いけすなどで そだてて とるのが ようしょくだよ' },
    { q: '太平洋がわに 工場が 帯のように ならぶ ところを 何という？', a: '太平洋ベルト', d: ['日本海ベルト', '中央高地', '北海道工業地帯'], e: '海に 近く 運びやすいので 工場が あつまるよ' },
    { q: '自動車工場で 部品を つくって おさめる 工場を 何という？', a: '関連工場', d: ['組み立て工場', '製鉄所', '発電所'], e: '関連工場から 部品が とどき、組み立て工場で 車に なるよ' },
    { q: 'テレビや 新聞など、多くの 人に 情報を 伝える ものを 何という？', a: 'マスメディア', d: ['ハザードマップ', 'コンパス', 'ダム'], e: '正しいか どうか 自分で たしかめる ことも 大事だよ' },
    { q: '森林には 水を たくわえる はたらきが ある。この よび名は？', a: '緑のダム', d: ['白いダム', '海のゆりかご', '空の道'], e: '森林は 雨水を たくわえて ゆっくり 流すので 緑のダムと よばれるよ' },
    { q: '気温を 調節した ハウスで 作物を そだてる 良さは？', a: '季節を ずらして 出荷しやすい', d: ['水が まったく いらない', 'どんな作物も 1日で育つ', '土地が なくても 必ず育つ'], e: 'ハウスでは温度などを調節し、出荷する時期を工夫できるよ' },
    { q: '海岸の 近くで 日帰りできるほどの 海で 行う ぎょぎょうは？', a: '沿岸ぎょぎょう', d: ['遠洋ぎょぎょう', '林業', '畜産業'], e: '沿岸漁業は海岸に近い海で行い、養殖も沿岸でさかんだよ' },
    { q: 'ニュースを 正しく 受け取るために 大切なことは？', a: 'いくつかの 情報源を くらべる', d: ['最初に見た話だけを信じる', '見出しだけで決める', 'だれにも確かめず広める'], e: '発信元や日付を見て、複数の情報を比べることが大切だよ' },
    { q: '森林の 木の根には どんな はたらきが ある？', a: '土を おさえて 流れにくくする', d: ['土を すべて かわかす', '雨を まったく降らせない', '川の水を ぜんぶ止める'], e: '木の根が土を支え、雨で土が流れたり崩れたりするのを防ぎやすくするよ' }
  ],
  6: [
    { q: '大きな 前方後円ふんが つくられた 時代は？', a: '古ふん時代', d: ['縄文時代', '弥生時代', '平安時代'], e: '力の ある 豪族や 大王の はかとして つくられたよ' },
    { q: '米づくりが 日本に 広まった 時代は？', a: '弥生時代', d: ['縄文時代', '鎌倉時代', '江戸時代'], e: '弥生時代に 米づくりが 広まり、むらが くにに なって いったよ' },
    { q: '十七条の憲法を つくった 人は？', a: '聖徳太子', d: ['中大兄皇子', '藤原道長', '源頼朝'], e: '聖徳太子は 冠位十二階や 十七条の憲法を 定めたよ' },
    { q: '鎌倉幕府を ひらいた 人は？', a: '源頼朝', d: ['足利尊氏', '徳川家康', '平清盛'], e: '源頼朝が 鎌倉に 幕府を ひらいたよ' },
    { q: '江戸幕府を ひらいた 人は？', a: '徳川家康', d: ['豊臣秀吉', '織田信長', '徳川吉宗'], e: '関ヶ原の 戦いに 勝ち、江戸に 幕府を ひらいたよ' },
    { q: '全国を 統一した 豊臣秀吉が 行った、田畑を はかる 政策は？', a: '太閤検地', d: ['楽市楽座', '参勤交代', '大化の改新'], e: '検地で 生産量を しらべ、刀狩で 武器を 集めたよ' },
    { q: '明治維新の あと、身分制度が どう なった？', a: '四民平等に なった', d: ['きびしく なった', 'かわらなかった', '武士だけに なった'], e: '江戸時代の 身分制度が あらためられたよ' },
    { q: '日本国憲法の 三つの原則に ふくまれない ものは？', a: '天皇主権', d: ['国民主権', '基本的人権の尊重', '平和主義'], e: '三原則は 国民主権・基本的人権の尊重・平和主義だよ' },
    { q: '日本国憲法が 施行された 日は？', a: '5月3日', d: ['11月3日', '2月11日', '1月1日'], e: '施行の 5月3日が 憲法記念日。公布は 11月3日だよ' },
    { q: '国の 法律を つくる ところは？', a: '国会', d: ['内閣', '裁判所', '市役所'], e: '国会が 法律を つくり、内閣が 実行し、裁判所が さばくよ（三権分立）' },
    { q: '裁判を 行う ところは？', a: '裁判所', d: ['国会', '内閣', '県庁'], e: '争いを 法律に もとづいて 解決するのが 裁判所だよ' },
    { q: '世界の 平和を まもる ために つくられた 国際組織は？', a: '国際連合（国連）', d: ['ユネスコだけ', 'オリンピック委員会', 'ＷＴＯ'], e: '1945年に つくられ、日本は 1956年に 加盟したよ' },
    { q: 'ユニセフが おもに 支えるのは だれ？', a: '世界の 子どもたち', d: ['一つの国の大人だけ', '会社の社長だけ', 'スポーツ選手だけ'], e: 'ユニセフは、世界の子どもの命や健康、教育を守る活動をしているよ' }
  ]
}

// 進級台帳の単元を、実際の設問バンクへ直接付与する。
const UNIT_KEYS = {
  3: ['map-symbols','map-symbols','map-symbols','map-symbols','safety','safety','shops','old-tools','old-tools','public-safety','public-safety','shops'],
  4: ['prefectures','prefectures','prefectures','prefectures','prefectures','waste-water','waste-water','waste-water','disasters','disasters','maps','maps'],
  5: ['land','land','land','land','agriculture','fishing','industry','industry','information','forests','agriculture','fishing','information','forests'],
  6: ['history','history','history','history','history','history','history','constitution','constitution','politics','politics','international','international']
}
for (const [grade, items] of Object.entries(BANK)) {
  items.forEach((item, index) => { item.unitId = `social:${grade}:${UNIT_KEYS[grade][index] || `topic-${index + 1}`}` })
}
export const SHAKAI_UNIT_IDS_BY_GRADE = Object.fromEntries(Object.entries(BANK).map(([grade, items]) => [grade, [...new Set(items.map((item) => item.unitId))]]))
export const SHAKAI_UNIT_EXPECTATIONS = Object.fromEntries(Object.entries(BANK).map(([grade, items]) => [grade, Object.fromEntries(items.map((item) => [item.q, item.unitId]))]))
export const SHAKAI_LESSON_POINTS = Object.fromEntries(Object.values(BANK).flat().reduce((map, item) => {
  const points = map.get(item.unitId) || []
  if (points.length < 2) points.push(item.e)
  map.set(item.unitId, points)
  return map
}, new Map()))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 直近に出した設問は しばらく除外する（固定文の問題バンクなので、
// 単純な毎回ランダムだと 同じ問題が連続で出てしまうことがあった）
let recentQs = []
const RECENT_MAX = 3
// 一度も出したことのない設問を最優先する（未出優先）。everSeen は
// ActivityPlayer が state.srs['shakai'] の既存キーから渡す「既出」集合で、
// 全部見たことがあれば、直近に出した設問を避けるだけの従来ロジックへ戻る。
function pickFresh(pool, everSeen) {
  const unseen = everSeen ? pool.filter((it) => !everSeen.has(`c:${it.q}`)) : []
  const source = unseen.length ? unseen : pool.filter((it) => !new Set(recentQs).has(it.q))
  const chosen = pick(source.length ? source : pool)
  recentQs = [chosen.q, ...recentQs].slice(0, RECENT_MAX)
  return chosen
}

function poolForGrade(grade) {
  const g = Math.max(3, Math.min(6, grade))
  return [...BANK[g]]
}

const ALL = Object.values(BANK).flat()
const BY_Q = Object.fromEntries(ALL.map((x) => [x.q, x]))

function build(item, cc) {
  const opts = shuffle([item.a, ...shuffle(item.d).slice(0, Math.max(2, cc - 1))])
  return {
    domain: 'shakai',
    unitId: item.unitId,
    skillId: item.unitId,
    type: 'choice',
    itemKey: `c:${item.q}`,
    visual: { kind: 'bigtext', text: '🗾' },
    instruction: item.q,
    speak: item.q,
    answerId: item.a,
    choices: opts.map((v) => ({ id: v, label: v, speak: v })),
    answerWord: { text: item.a },
    explain: item.e
  }
}

export function generateShakaiQuestion(params, reviewKey = null) {
  const cc = Math.max(3, params.choiceCount || 3)
  if (reviewKey && reviewKey.startsWith('c:')) {
    const it = BY_Q[reviewKey.slice(2)]
    if (it) return build(it, cc)
  }
  if (params.unitId) {
    const pool = ALL.filter((item) => item.unitId === params.unitId)
    if (pool.length) return build(pickFresh(pool, params.everSeenKnowledge), cc)
    return null
  }
  return build(pickFresh(poolForGrade(params.grade || 3), params.everSeenKnowledge), cc)
}

export const SHAKAI_COUNT = ALL.length
export const SHAKAI_QUESTIONS = ALL.map((item) => item.q)
