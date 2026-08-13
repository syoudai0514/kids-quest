// ============================================================
// むずかしいモード（Phase 2 / WP10）— りか 発展内容
//
// 対象は小4〜6。中学受験でよく出る10分野を扱う:
//   てこ・滑車・ばね / 電気回路（直列・並列） / 光の反射・屈折 / 浮力 /
//   水よう液と中和 / 気体の性質 / 人体（応用） / 食物連鎖 / 天体（応用） /
//   地層・地震
//
// rika.js（通常モード）と同じ固定バンク方式。数値計算が要る電気回路の
// 一部も、答えの候補を選ぶ4択（type:'choice'）のままにする（算数hardの
// ような数値入力にはしない。理科は「知識として選べるか」を見る形式）。
//
// 通常モードとの分離（計画書§4.2(d)、numbers-hard.js/reading-hard.jsと同じ設計）:
//   - itemKey は必ず `hard:r:...` の名前空間を使う。
//   - unitId も明示的に `hard:rika:...` を持たせる。unitLedger() は
//     RIKA_UNIT_IDS_BY_GRADE などの固定リストからしか単元を集めないため、
//     ここで作る unitId は進級必須単元に一切混ざらない。
// ============================================================

// { q: 問題文, a: 正解, d: [まちがい選択肢], e: かいせつ, unit: 単元キー }
const BANK = [
  // ---- てこ・滑車・ばね ----
  { q: 'てこで、力を加える点を何という？', a: '力点', d: ['支点', '作用点', '重点'], e: '支点は棒を支える点、作用点は力がはたらく点、力点は力を加える点だよ', unit: 'lever' },
  { q: 'てこで、支点から力点までのきょりを長くすると、ものを動かすのに必要な力は？', a: '小さくなる', d: ['大きくなる', 'かわらない', '0になる'], e: '支点から力点までのきょりが長いほど、同じ作用点の効果を得るのに必要な力は小さくてすむよ（てこのはたらき）', unit: 'lever' },
  { q: '動滑車を使うと、荷物を持ち上げるのに必要な力は？', a: '半分になる（引くきょりは2倍になる）', d: ['2倍になる（引くきょりは半分になる）', 'かわらない', '0になる'], e: '動滑車は力を半分にできるが、引くひもの長さは2倍必要になるよ', unit: 'lever' },
  { q: '定滑車を使うと、荷物を持ち上げるのに必要な力の大きさは？', a: 'かわらない（向きだけ変えられる）', d: ['半分になる（引く力が半分ですむ）', '2倍になる（より大きな力が必要になる）', '0になる（力を使わず持ち上がる）'], e: '定滑車は力の向きを変えるだけで、大きさは変わらないよ', unit: 'lever' },
  { q: 'ばねに加える力を2倍にすると、ばねののびは？', a: '2倍になる', d: ['半分になる', '4倍になる', 'かわらない'], e: 'ばねののびは、加える力の大きさに比例するよ（フックの法則）', unit: 'lever' },

  // ---- 電気回路（直列・並列） ----
  { q: '同じ豆電球2個を直列つなぎにすると、1個のときと比べて明るさは？', a: '暗くなる', d: ['明るくなる', 'かわらない', '消える'], e: '直列つなぎでは回路全体の抵抗が増え、流れる電流が小さくなるので暗くなるよ', unit: 'circuit' },
  { q: '同じ豆電球2個を並列つなぎにすると、1個のときと比べて明るさは？', a: 'かわらない', d: ['暗くなる', '2倍明るくなる', '消える'], e: '並列つなぎでは、それぞれの豆電球に電池と同じ電圧がかかるので、明るさは1個のときと変わらないよ', unit: 'circuit' },
  { q: '1.5Vの電池を2個直列につなぐと、全体の電圧は？', a: '3V', d: ['1.5V', '0.75V', '4.5V'], e: '直列つなぎでは電圧が足し算になるので、1.5V×2＝3Vになるよ', unit: 'circuit' },
  { q: '1.5Vの電池を2個並列につなぐと、全体の電圧は？', a: '1.5V', d: ['3V', '0.75V', '0V'], e: '並列つなぎでは電圧は変わらず1.5Vのままだよ（かわりに電池が長持ちする）', unit: 'circuit' },

  // ---- 光の反射・屈折 ----
  { q: '光が鏡に当たってはね返るとき、入る角度とはね返る角度の関係は？', a: '同じになる', d: ['入る角度の方が大きい', 'はね返る角度の方が大きい', '関係ない'], e: '入射角と反射角は、いつも等しくなるよ（反射の法則）', unit: 'light-refraction' },
  { q: '光が水中から空気中へ進むとき、境目で曲がることを何という？', a: '屈折', d: ['反射', '分散', '回折'], e: '光が異なる物質の境目で進む向きを変えることを屈折というよ', unit: 'light-refraction' },
  { q: 'ストローをコップの水に入れると、折れて見えるのはなぜ？', a: '光が水と空気の境目で屈折するから', d: ['水が光を吸収するから', 'ストローが実際に曲がるから', '水が光を反射しないから'], e: '光は水中と空気中で進む速さが違うため、境目で折れ曲がって見えるよ', unit: 'light-refraction' },

  // ---- 浮力 ----
  { q: '水にうかんだ物体にはたらく、水がおし上げる力を何という？', a: '浮力', d: ['重力', '圧力', 'まさつ力'], e: '水中の物体には、水が上向きにおす力（浮力）がはたらくよ', unit: 'buoyancy' },
  { q: '物体がうくかしずむかは、何と何の大きさを比べて決まる？', a: '重さと浮力', d: ['重さと大きさ', '色と形', '温度と重さ'], e: '重さが浮力より大きいとしずみ、小さいとうくよ', unit: 'buoyancy' },
  { q: '同じ体積なら、水よりみつ度が小さいものは、水にうく？しずむ？', a: 'うく', d: ['しずむ', '水中で止まる', 'とける'], e: 'みつ度が水より小さいものは水にうき、大きいものはしずむよ', unit: 'buoyancy' },

  // ---- 水よう液と中和 ----
  { q: '酸性の水よう液とアルカリ性の水よう液を混ぜて、たがいの性質を打ち消し合うことを何という？', a: '中和', d: ['蒸発', 'ろ過', '結晶'], e: '酸性とアルカリ性が混ざり合って性質を打ち消すことを中和というよ', unit: 'solutions-neutralize' },
  { q: '青色リトマス紙を赤色に変える水よう液は、何性？', a: '酸性', d: ['アルカリ性', '中性', '塩性'], e: '青色リトマス紙を赤くするのが酸性、赤色リトマス紙を青くするのがアルカリ性だよ', unit: 'solutions-neutralize' },
  { q: 'うすい塩酸に鉄を入れると、どうなる？', a: 'あわを出しながらとける', d: ['変化せず、そのままのこる', '鉄がとけずに大きくなる', '塩酸がこおって氷になる'], e: 'うすい塩酸は鉄をとかし、水素のあわが発生するよ', unit: 'solutions-neutralize' },

  // ---- 気体の性質 ----
  { q: 'ものが燃えるために必要な、空気中の気体は？', a: '酸素', d: ['ちっ素', '二酸化炭素', '水素'], e: 'ものが燃えるには酸素が必要。ちっ素や二酸化炭素にはものを燃やす力がないよ', unit: 'gas-properties' },
  { q: '石灰水を白くにごらせる気体は？', a: '二酸化炭素', d: ['酸素', 'ちっ素', '水素'], e: '二酸化炭素を石灰水に通すと、白くにごるよ（二酸化炭素を確かめる方法）', unit: 'gas-properties' },
  { q: '空気中にいちばん多くふくまれる気体は？', a: 'ちっ素', d: ['酸素', '二酸化炭素', '水素'], e: '空気の体積の約78％はちっ素、約21％は酸素だよ', unit: 'gas-properties' },

  // ---- 人体（応用） ----
  { q: '食べ物を消化する液を出す、体の中の器官はどれ？', a: '胃', d: ['心臓', '肺', 'じん臓'], e: '胃は胃液を出して、食べ物を消化するよ', unit: 'body-advanced' },
  { q: '血液が心臓から送り出され、全身をめぐって心臓にもどることを何という？', a: '血液じゅんかん', d: ['消化（食べ物の分解）', '呼吸（気体の交かん）', 'はい出（不要物を出す）'], e: '心臓のはたらきで血液が全身をめぐることを血液じゅんかんというよ', unit: 'body-advanced' },
  { q: '呼吸で、体に取り入れられる気体と、体から出される気体の組は？', a: '酸素を取り入れ、二酸化炭素を出す', d: ['二酸化炭素を取り入れ、酸素を出す', 'ちっ素を取り入れ、酸素を出す', '水素を取り入れ、酸素を出す'], e: '呼吸では酸素を体内に取り入れ、二酸化炭素を体外に出すよ', unit: 'body-advanced' },

  // ---- 食物連鎖 ----
  { q: '生物どうしの「食べる・食べられる」の関係を何という？', a: '食物連鎖', d: ['生態系', '光合成', '共生'], e: '生物どうしがつながる食べる・食べられるの関係を食物連鎖というよ', unit: 'food-chain' },
  { q: '食物連鎖で、いちばん最初（出発点）になるのはどんな生物？', a: '植物（生産者）', d: ['肉食動物', '草食動物', 'キノコやカビ'], e: '植物は光合成で自分で養分を作れる「生産者」で、食物連鎖の出発点になるよ', unit: 'food-chain' },
  { q: '自然界で、生物の死がいなどを分解する生物を何という？', a: '分解者', d: ['生産者', '消費者', '捕食者'], e: 'キノコやカビ、細菌などは死がいなどを分解する「分解者」だよ', unit: 'food-chain' },

  // ---- 天体（応用） ----
  { q: '月が満ち欠けして、また同じ形にもどるまでの日数は、およそ何日？', a: '約29.5日', d: ['約7日', '約100日', '約365日'], e: '月の満ち欠けの周期は、およそ29.5日だよ', unit: 'astronomy-advanced' },
  { q: '地球が太陽のまわりを1回まわるのにかかる時間は？', a: '1年', d: ['1日', '1か月', '10年'], e: '地球が太陽のまわりを1周する（公転する）のにかかる時間が1年だよ', unit: 'astronomy-advanced' },
  { q: '地球がじくを中心に1日1回転することを何という？', a: '自転', d: ['公転', '満ち欠け', '日食'], e: '地球が1日1回転することを自転というよ。これで昼と夜ができるよ', unit: 'astronomy-advanced' },

  // ---- 地層・地震 ----
  { q: 'れき・砂・どろが層になって積み重なったものを何という？', a: '地層', d: ['火山', 'マグマ', '岩しょう'], e: 'れき・砂・どろなどが積み重なってできた層を地層というよ', unit: 'strata-earthquake' },
  { q: '地層をつくる、つぶの大きいものから小さいものへの順は？', a: 'れき→砂→どろ', d: ['どろ→砂→れき', '砂→れき→どろ', 'どろ→れき→砂'], e: 'つぶの大きさは、れき（大）＞砂（中）＞どろ（小）の順だよ', unit: 'strata-earthquake' },
  { q: '地震のゆれの中心（地下）を何という？', a: 'しん源', d: ['しん度', 'マグニチュード', '断層'], e: '地震が発生した地下の場所をしん源というよ', unit: 'strata-earthquake' }
]

const UNIT_LABELS = {
  lever: 'てこ・滑車・ばね', circuit: '電気回路', 'light-refraction': '光の反射・屈折',
  buoyancy: '浮力', 'solutions-neutralize': '水よう液と中和', 'gas-properties': '気体の性質',
  'body-advanced': '人体（応用）', 'food-chain': '食物連鎖', 'astronomy-advanced': '天体（応用）',
  'strata-earthquake': '地層・地震'
}
for (const item of BANK) item.unitId = `hard:rika:${item.unit}`

export const HARD_RIKA_UNIT_IDS = [...new Set(BANK.map((item) => item.unitId))]
export const HARD_RIKA_LABELS = Object.fromEntries(Object.entries(UNIT_LABELS).map(([k, v]) => [`hard:rika:${k}`, v]))

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
  const unseen = everSeen ? pool.filter((it) => !everSeen.has(`hard:r:${it.q}`)) : []
  const source = unseen.length ? unseen : pool.filter((it) => !new Set(recentQs).has(it.q))
  const chosen = pick(source.length ? source : pool)
  recentQs = [chosen.q, ...recentQs].slice(0, RECENT_MAX)
  return chosen
}

// rika.js と同じ「最長の誤答を必ず含める」対策（正解が単独最長になる
// 見た目のヒントを消すため）。
function build(item, cc) {
  const longestWrong = [...item.d].sort((a, b) => b.length - a.length)[0]
  const otherWrong = shuffle(item.d.filter((value) => value !== longestWrong)).slice(0, Math.max(1, cc - 2))
  const opts = shuffle([item.a, longestWrong, ...otherWrong])
  return {
    domain: 'rika',
    unitId: item.unitId,
    skillId: item.unitId,
    type: 'choice',
    itemKey: `hard:r:${item.q}`,
    visual: { kind: 'bigtext', text: '🔬' },
    instruction: item.q,
    speak: item.q,
    answerId: item.a,
    choices: opts.map((v) => ({ id: v, label: v, speak: v })),
    answerWord: { text: item.a },
    explain: item.e
  }
}

export function generateHardRikaQuestion(params, reviewKey = null) {
  const cc = Math.max(3, params.choiceCount || 3)
  if (reviewKey && reviewKey.startsWith('hard:r:')) {
    const it = BY_Q[reviewKey.slice(7)]
    if (it) return build(it, cc)
  }
  return build(pickFresh(BANK, params.everSeenKnowledge), cc)
}

export const HARD_RIKA_QUESTIONS = BANK.map((item) => item.q)
