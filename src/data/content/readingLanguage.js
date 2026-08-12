// ============================================================
// 「よむ」分野 WP2: こくご新形式10種
//   語彙・慣用句 / ことわざ / 四字熟語 / 対義語 / 類義語 / 同音異義語 /
//   部首 / 送りがな / 主語・述語・修飾語 / 敬語 / 短文読解
//
// reading.js から呼ばれる。絵合わせ（WORDS）・熟語音読み（JUKUGO）とは
// 別の「意味・使い方・文のしくみ」を問う形式のため、ここに分離する
// （計画書: reading.js の肥大化を避けるため分割を推奨）。
//
// 全形式で共通の設計:
//   - 各項目は minGrade を持ち、その学年以上で出題対象になる
//   - itemKey は計画書の接頭辞（idiom: / proverb: / ... ）に一致させる
//   - 誤答選択肢は、同じ形式・同じ学年帯の「他の項目の正解」を流用できる
//     ものはそこから、文脈依存で流用できないもの（送りがな・文法・敬語の
//     一部・短文読解）は項目ごとに書き下ろす
//   - explain は「答えの言い換え」だけで終わらせず、由来・使い方・見分け方
//     など「なぜ」を必ず一言添える（計画書§2原則4）
// ============================================================

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function eligible(pool, grade) {
  return pool.filter((item) => (item.minGrade ?? 0) <= grade)
}

// 一度も出したことのない項目を最優先する（未出優先）。
function pickUnseenFirst(pool, everSeen, keyOf) {
  if (everSeen) {
    const unseen = pool.filter((item) => !everSeen.has(keyOf(item)))
    if (unseen.length) return shuffle(unseen)[0]
  }
  return shuffle(pool)[0]
}

// 同じプール内の「他の項目の正解」から誤答を集める（意味・対義語などの
// 定義もの向け）。文脈に依存する形式（送りがな等）には使わない。
function poolDistractors(pool, exclude, answerOf, n) {
  const seen = new Set([answerOf(exclude)])
  const out = []
  for (const item of shuffle(pool)) {
    if (out.length >= n) break
    if (item === exclude) continue
    const value = answerOf(item)
    if (!value || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

// ------------------------------------------------------------
// 1. 語彙・慣用句（小3〜）
// ------------------------------------------------------------
export const IDIOMS = [
  { phrase: '油を売る', meaning: '仕事の途中でむだ話をして、なまけること', note: '江戸時代、油売りが客とおしゃべりしながら油を量り売りしていたことから生まれた言葉だよ。', minGrade: 3 },
  { phrase: '猫の手も借りたい', meaning: 'とても忙しくて、誰の助けでもほしいこと', note: '役に立たなそうな猫の手さえ借りたいというたとえで、いそがしさを表すよ。', minGrade: 3 },
  { phrase: '顔が広い', meaning: '知り合いがたくさんいること', note: '「顔」を人との付き合いの範囲にたとえた言い方だよ。', minGrade: 3 },
  { phrase: '耳が痛い', meaning: '自分の弱点を言われて、聞くのがつらいこと', note: '本当に耳が痛いのではなく、図星を指されたつらさをたとえているよ。', minGrade: 3 },
  { phrase: '腹を割って話す', meaning: '本当の気持ちをかくさずに話すこと', note: '「腹（心の中）を割って見せる」というたとえだよ。', minGrade: 4 },
  { phrase: '頭を冷やす', meaning: '興奮した気持ちをしずめて、冷静になること', note: '頭に血がのぼった状態を、実際に冷やすように落ち着かせるという意味だよ。', minGrade: 3 },
  { phrase: '目からうろこが落ちる', meaning: '何かがきっかけで、急に物事がよく分かるようになること', note: 'うろこで目がふさがれていたのが取れて、急に見えるようになる様子からきているよ。', minGrade: 4 },
  { phrase: '口が軽い', meaning: '秘密などをすぐに話してしまうこと', note: '反対に、秘密を守れる人は「口が堅い」というよ。', minGrade: 4 },
  { phrase: '手も足も出ない', meaning: '自分の力ではどうすることもできないこと', note: '手足を動かすことすらできない、という強い言い方だよ。', minGrade: 4 },
  { phrase: '足を洗う', meaning: '悪いことや好ましくない仕事をやめること', note: '昔、はだしで働いた後に足を洗って家に上がったことから、区切りをつける意味になったよ。', minGrade: 5 },
  { phrase: '骨が折れる', meaning: '苦労が多く、大変であること', note: '実際に骨折するのではなく、大変な苦労のたとえだよ。', minGrade: 4 },
  { phrase: '馬が合う', meaning: '気が合い、仲良くなれること', note: '乗り手と馬の呼吸が合うことから、人間どうしの相性にも使うようになったよ。', minGrade: 5 },
  { phrase: '肩の荷が下りる', meaning: '責任や心配ごとがなくなり、ほっとすること', note: '重い荷物をおろしたときの軽さを、気持ちのほっとした感じにたとえているよ。', minGrade: 5 },
  { phrase: '筆が立つ', meaning: '文章を書くのが上手なこと', note: '「筆」は書くこと・文章そのものを表す言葉として使われるよ。', minGrade: 5 },
  { phrase: '油断も隙もない', meaning: '少しも気をゆるめられない、注意が必要なこと', note: '「油断」も「隙」も、気持ちがゆるむことを表す言葉だよ。', minGrade: 5 },
  { phrase: '水に流す', meaning: '過去のいざこざを、なかったことにして忘れること', note: '川の水が過去のことを運び去っていくイメージからきているよ。', minGrade: 4 },
  { phrase: '棚に上げる', meaning: '自分に都合の悪いことを、わざと問題にしないでおくこと', note: '高い棚に物を上げて、見えないようにするイメージからきているよ。', minGrade: 6 },
  { phrase: '折り紙付き', meaning: '実力や価値が確かだと保証されていること', note: '昔、鑑定書として「折り紙」という紙を添えたことに由来するよ。', minGrade: 6 }
]

// ------------------------------------------------------------
// 2. ことわざ（小3〜）
// ------------------------------------------------------------
export const PROVERBS = [
  { phrase: '急がば回れ', meaning: '急ぐときほど、遠くても安全で確実な道を選んだほうがよい', note: '琵琶湖を船でわたる近道より、遠回りでも安全な陸路のほうが結局早かった、という昔の話から生まれたよ。', minGrade: 3 },
  { phrase: '石の上にも三年', meaning: 'つらくてもがまんして続ければ、いつか成功する', note: '冷たい石の上でも三年すわり続ければ温まる、というたとえから、忍耐の大切さを表すよ。', minGrade: 3 },
  { phrase: '猿も木から落ちる', meaning: 'どんなに得意なことでも、失敗することがある', note: '木登りが得意なはずの猿でも、落ちることがあるというたとえだよ。', minGrade: 3 },
  { phrase: '灯台下暗し', meaning: '身近なことは、かえって気づきにくいこと', note: '昔の灯台（明かりを乗せた台）は、台のすぐ下が暗くて見えなかったことからきているよ。', minGrade: 4 },
  { phrase: '七転び八起き', meaning: '何度失敗しても、あきらめずに立ち上がること', note: '七回転んでも八回起き上がる、という数え方に「くじけない心」がこめられているよ。', minGrade: 3 },
  { phrase: '塵も積もれば山となる', meaning: '小さなことでも、積み重なると大きな結果になる', note: '一つ一つは小さな「塵（ちり）」でも、積もれば山になるというたとえだよ。', minGrade: 3 },
  { phrase: '雨降って地固まる', meaning: 'もめごとや困難があったあとは、かえって物事がうまく収まる', note: '雨が降ったあとの地面は、乾いた地面よりかたく固まることからきているよ。', minGrade: 4 },
  { phrase: '二階から目薬', meaning: '思うようにいかず、まわりくどくて効き目がないこと', note: '二階から一階の目に目薬をさそうとしても、まず届かないという例えだよ。', minGrade: 5 },
  { phrase: '井の中の蛙大海を知らず', meaning: 'せまい世界のことしか知らず、広い世界があることに気づかないこと', note: '井戸の中のカエルは、広い海があることを知らない、というたとえ話だよ。', minGrade: 5 },
  { phrase: '転ばぬ先の杖', meaning: '失敗しないように、前もって準備をしておくこと', note: '転ぶ前に杖（つえ）を用意しておく、という備えの大切さを表すよ。', minGrade: 4 },
  { phrase: '光陰矢の如し', meaning: '月日が過ぎるのは、矢が飛ぶようにとても速いこと', note: '「光陰」は月日、「矢の如し」は矢のように速いという意味だよ。', minGrade: 5 },
  { phrase: '百聞は一見に如かず', meaning: '何度も話を聞くより、一度自分の目で見るほうがよく分かる', note: '百回聞くことより、たった一回見ることのほうが確かだ、という意味だよ。', minGrade: 5 },
  { phrase: '苦あれば楽あり', meaning: '苦しいことのあとには、楽しいことがやってくる', note: '苦しさと楽しさは交互にやってくる、という励ましの言葉だよ。', minGrade: 4 },
  { phrase: '虎穴に入らずんば虎子を得ず', meaning: '危険を覚悟しなければ、大きな成果は得られない', note: '虎の穴に入らなければ、虎の子（大きな価値のあるもの）は手に入らないという意味だよ。', minGrade: 6 },
  { phrase: '覆水盆に返らず', meaning: '一度してしまったことは、もう取り返しがつかない', note: 'こぼれた水（覆水）は、盆（うつわ）に戻すことができない、というたとえだよ。', minGrade: 6 },
  { phrase: '五十歩百歩', meaning: '少しの違いはあっても、本質的には同じであること', note: '戦場で五十歩逃げた人が百歩逃げた人を笑った、という話から生まれた言葉だよ。', minGrade: 6 }
]

// ------------------------------------------------------------
// 3. 四字熟語（小5〜）
// ------------------------------------------------------------
export const YOJI = [
  { word: '一石二鳥', meaning: '一つのことをして、二つの得をすること', note: '一つの石を投げて二羽の鳥を落とす、というたとえから生まれたよ。', minGrade: 5 },
  { word: '以心伝心', meaning: '言葉にしなくても、気持ちが相手に伝わること', note: 'もとは仏教で、文字や言葉を使わずに心から心へ教えを伝えることを表した言葉だよ。', minGrade: 5 },
  { word: '一期一会', meaning: '一生に一度だけの出会いだと思って、大切にすること', note: '茶道から生まれた言葉で、その日のその時間は二度と来ないという心構えを表すよ。', minGrade: 5 },
  { word: '温故知新', meaning: '昔のことを研究して、そこから新しい知識や考えを得ること', note: '「故（ふる）きを温（たず）ねて新しきを知る」という中国の古い言葉が由来だよ。', minGrade: 6 },
  { word: '臨機応変', meaning: 'その場のようすに合わせて、うまく対応すること', note: '「臨機」はその場に出会うこと、「応変」は変化に応じることを表すよ。', minGrade: 6 },
  { word: '大器晩成', meaning: '本当に優れた人物は、時間をかけてゆっくり実力を発揮すること', note: '大きな器（うつわ）は作るのに時間がかかる、というたとえから生まれたよ。', minGrade: 6 },
  { word: '弱肉強食', meaning: '弱いものが強いものの犠牲になる、きびしい競争の世界のこと', note: '自然界で弱い動物が強い動物の食べ物になることからきているよ。', minGrade: 6 },
  { word: '十人十色', meaning: '人によって考え方や好みがそれぞれ違うこと', note: '十人いれば、好みや考えは十とおりある、という意味だよ。', minGrade: 5 },
  { word: '自業自得', meaning: '自分がしたことの報いを、自分が受けること', note: 'もとは仏教の言葉で、自分の行い（業）の結果を自分で得るという意味だよ。', minGrade: 6 },
  { word: '前代未聞', meaning: '今までに一度も聞いたことがないほど、めずらしいこと', note: '「前代」は今より前の時代、「未聞」はまだ聞いたことがないという意味だよ。', minGrade: 6 },
  { word: '一長一短', meaning: '良いところもあれば、悪いところもあること', note: '「長」は良い点、「短」は悪い点を表しているよ。', minGrade: 5 },
  { word: '半信半疑', meaning: '半分は信じ、半分はうたがう気持ちでいること', note: '話がすぐには信じきれず、迷っている状態を表すよ。', minGrade: 5 },
  { word: '完全無欠', meaning: '欠点がまったくなく、完璧なこと', note: '「完全」も「無欠」も、欠けているところがないという意味を重ねて強めているよ。', minGrade: 6 },
  { word: '一心不乱', meaning: '一つのことに集中して、他のことに気を取られないこと', note: '「乱れる心」が一つも無い状態を表すよ。', minGrade: 5 }
]

// ------------------------------------------------------------
// 4. 対義語（小3〜）
// ------------------------------------------------------------
export const ANTONYMS = [
  { word: '増加', opposite: '減少', usage: '工場の生産量が増加した／不良品の数は減少した', minGrade: 3 },
  { word: '拡大', opposite: '縮小', usage: '公園を拡大する計画／予算を縮小する', minGrade: 3 },
  { word: '出発', opposite: '到着', usage: '朝9時に出発した／夕方に到着した', minGrade: 3 },
  { word: '原因', opposite: '結果', usage: '事故の原因を調べる／がんばった結果、優勝した', minGrade: 3 },
  { word: '積極的', opposite: '消極的', usage: '積極的に発言する／消極的な態度をとる', minGrade: 4 },
  { word: '複雑', opposite: '単純', usage: '複雑な仕組み／単純な計算', minGrade: 4 },
  { word: '義務', opposite: '権利', usage: '税金を納める義務／投票する権利', minGrade: 4 },
  { word: '希望', opposite: '絶望', usage: '希望を持って進む／絶望的な状況になる', minGrade: 4 },
  { word: '客観的', opposite: '主観的', usage: '客観的に判断する／主観的な意見を言う', minGrade: 5 },
  { word: '需要', opposite: '供給', usage: '商品の需要が高まる／供給が追いつかない', minGrade: 5 },
  { word: '肯定', opposite: '否定', usage: '意見に肯定する／事実を否定する', minGrade: 5 },
  { word: '理想', opposite: '現実', usage: '理想を語る／現実を見つめる', minGrade: 5 },
  { word: '抽象的', opposite: '具体的', usage: '抽象的な説明／具体的な例をあげる', minGrade: 6 },
  { word: '保守的', opposite: '革新的', usage: '保守的な考え方／革新的な発明', minGrade: 6 },
  { word: '能動的', opposite: '受動的', usage: '能動的に学ぶ／受動的に授業を受ける', minGrade: 6 },
  { word: '長所', opposite: '短所', usage: '自分の長所を伸ばす／短所を直す努力をする', minGrade: 3 },
  { word: '好調', opposite: '不調', usage: 'チームは好調だ／体の不調を感じる', minGrade: 4 },
  { word: '楽観', opposite: '悲観', usage: '楽観的に考える／悲観してあきらめる', minGrade: 5 }
]

// ------------------------------------------------------------
// 5. 類義語（小3〜）
// ------------------------------------------------------------
export const SYNONYMS = [
  { word: '進歩', synonym: '発展', usage: '技術が進歩する＝技術が発展する', minGrade: 3 },
  { word: '欠点', synonym: '短所', usage: '欠点を直す＝短所を直す', minGrade: 3 },
  { word: '方法', synonym: '手段', usage: '解決の方法をさがす＝解決の手段をさがす', minGrade: 3 },
  { word: '理由', synonym: '原因', usage: '遅刻した理由を話す＝遅刻した原因を話す', minGrade: 3 },
  { word: '許可', synonym: '承認', usage: '外出の許可をもらう＝外出の承認をもらう', minGrade: 4 },
  { word: '決心', synonym: '決意', usage: 'やり通す決心をする＝やり通す決意をする', minGrade: 4 },
  { word: '関心', synonym: '興味', usage: '宇宙に関心がある＝宇宙に興味がある', minGrade: 4 },
  { word: '重大', synonym: '深刻', usage: '重大な問題＝深刻な問題', minGrade: 4 },
  { word: '簡単', synonym: '容易', usage: '簡単に解ける＝容易に解ける', minGrade: 4 },
  { word: '改善', synonym: '向上', usage: '生活を改善する＝生活を向上させる', minGrade: 5 },
  { word: '手段', synonym: '方策', usage: '解決の手段を考える＝解決の方策を考える', minGrade: 5 },
  { word: '案外', synonym: '意外', usage: '案外むずかしかった＝意外にむずかしかった', minGrade: 5 },
  { word: '長所', synonym: '美点', usage: '彼の長所は明るさだ＝彼の美点は明るさだ', minGrade: 5 },
  { word: '互角', synonym: '対等', usage: '実力は互角だ＝実力は対等だ', minGrade: 6 },
  { word: '簡潔', synonym: '簡明', usage: '簡潔に説明する＝簡明に説明する', minGrade: 6 },
  { word: '着手', synonym: '開始', usage: '工事に着手する＝工事を開始する', minGrade: 6 }
]

// ------------------------------------------------------------
// 6. 同音異義語（小4〜）: 文脈に合う漢字を選ぶ
// ------------------------------------------------------------
export const HOMOPHONES = [
  {
    kana: 'かんしん',
    sentence: '発明品のアイデアに、みんなが○○した。',
    options: [
      { kanji: '感心', meaning: 'すばらしいと心を動かされること' },
      { kanji: '関心', meaning: '興味を持つこと' }
    ],
    correctKanji: '感心',
    minGrade: 4
  },
  {
    kana: 'かんしん',
    sentence: '最近、環境問題への○○が高まっている。',
    options: [
      { kanji: '感心', meaning: 'すばらしいと心を動かされること' },
      { kanji: '関心', meaning: '興味を持つこと' }
    ],
    correctKanji: '関心',
    minGrade: 4
  },
  {
    kana: 'いどう',
    sentence: '電車で となりの駅まで○○した。',
    options: [
      { kanji: '移動', meaning: '場所を移ること' },
      { kanji: '異動', meaning: '仕事の担当や部署が変わること' }
    ],
    correctKanji: '移動',
    minGrade: 4
  },
  {
    kana: 'いどう',
    sentence: '父が4月から新しい部署へ○○になった。',
    options: [
      { kanji: '移動', meaning: '場所を移ること' },
      { kanji: '異動', meaning: '仕事の担当や部署が変わること' }
    ],
    correctKanji: '異動',
    minGrade: 5
  },
  {
    kana: 'たいしょう',
    sentence: 'このアンケートは小学生を○○にしている。',
    options: [
      { kanji: '対象', meaning: 'ものごとの相手・目当てとなるもの' },
      { kanji: '対称', meaning: '形や位置がつり合っていること' }
    ],
    correctKanji: '対象',
    minGrade: 5
  },
  {
    kana: 'たいしょう',
    sentence: 'この図形は左右○○になっている。',
    options: [
      { kanji: '対象', meaning: 'ものごとの相手・目当てとなるもの' },
      { kanji: '対称', meaning: '形や位置がつり合っていること' }
    ],
    correctKanji: '対称',
    minGrade: 5
  },
  {
    kana: 'せいさく',
    sentence: '新しいアニメ映画の○○が始まった。',
    options: [
      { kanji: '製作', meaning: '物を作ること' },
      { kanji: '政策', meaning: '政治の方針' }
    ],
    correctKanji: '製作',
    minGrade: 5
  },
  {
    kana: 'せいさく',
    sentence: '国は新しい子育て支援の○○を発表した。',
    options: [
      { kanji: '製作', meaning: '物を作ること' },
      { kanji: '政策', meaning: '政治の方針' }
    ],
    correctKanji: '政策',
    minGrade: 6
  },
  {
    kana: 'ようい',
    sentence: '遠足の持ち物を前日に○○した。',
    options: [
      { kanji: '用意', meaning: '前もって準備すること' },
      { kanji: '容易', meaning: 'たやすいこと' }
    ],
    correctKanji: '用意',
    minGrade: 4
  },
  {
    kana: 'ようい',
    sentence: 'このパズルは○○に解けるほど、かんたんだ。',
    options: [
      { kanji: '用意', meaning: '前もって準備すること' },
      { kanji: '容易', meaning: 'たやすいこと' }
    ],
    correctKanji: '容易',
    minGrade: 5
  },
  {
    kana: 'かいとう',
    sentence: 'テストの○○らんに答えを書いた。',
    options: [
      { kanji: '回答', meaning: '質問や要求に答えること' },
      { kanji: '解答', meaning: '問題を解いて答えを出すこと' }
    ],
    correctKanji: '解答',
    minGrade: 5
  },
  {
    kana: 'かいとう',
    sentence: 'アンケートに○○してもらう。',
    options: [
      { kanji: '回答', meaning: '質問や要求に答えること' },
      { kanji: '解答', meaning: '問題を解いて答えを出すこと' }
    ],
    correctKanji: '回答',
    minGrade: 6
  }
]

// ------------------------------------------------------------
// 7. 部首（小3〜）
// ------------------------------------------------------------
export const RADICALS = [
  { kanji: '河', radical: 'さんずい（氵）', hint: '水に関係する漢字によく使われる', minGrade: 3 },
  { kanji: '林', radical: 'き（木）', hint: '木や植物に関係する漢字によく使われる', minGrade: 3 },
  { kanji: '晴', radical: 'ひへん（日）', hint: '太陽や時間に関係する漢字によく使われる', minGrade: 3 },
  { kanji: '花', radical: 'くさかんむり（艹）', hint: '草花に関係する漢字によく使われる', minGrade: 3 },
  { kanji: '持', radical: 'てへん（扌）', hint: '手の動きに関係する漢字によく使われる', minGrade: 3 },
  { kanji: '海', radical: 'さんずい（氵）', hint: '水に関係する漢字によく使われる', minGrade: 3 },
  { kanji: '思', radical: 'こころ（心）', hint: '気持ちに関係する漢字によく使われる', minGrade: 4 },
  { kanji: '駅', radical: 'うまへん（馬）', hint: '馬や乗り物に関係する漢字によく使われる', minGrade: 4 },
  { kanji: '究', radical: 'あなかんむり（穴）', hint: '穴や空間に関係する漢字によく使われる', minGrade: 4 },
  { kanji: '間', radical: 'もんがまえ（門）', hint: '門や仕切りに関係する漢字によく使われる', minGrade: 4 },
  { kanji: '院', radical: 'こざとへん（阝）', hint: '土地の高低や場所に関係する漢字によく使われる', minGrade: 4 },
  { kanji: '談', radical: 'ごんべん（訁）', hint: '言葉や話すことに関係する漢字によく使われる', minGrade: 4 },
  { kanji: '飯', radical: 'しょくへん（飠）', hint: '食べ物に関係する漢字によく使われる', minGrade: 4 },
  { kanji: '銀', radical: 'かねへん（釒）', hint: '金属に関係する漢字によく使われる', minGrade: 4 },
  { kanji: '複', radical: 'ころもへん（衤）', hint: '衣服に関係する漢字によく使われる', minGrade: 5 },
  { kanji: '築', radical: 'たけかんむり（竹）', hint: '竹や建物に関係する漢字によく使われる', minGrade: 5 },
  { kanji: '態', radical: 'こころ（心）', hint: '気持ちや心のようすに関係する漢字によく使われる', minGrade: 5 },
  { kanji: '骨', radical: 'ほね（骨）', hint: '体のつくりに関係する漢字によく使われる', minGrade: 6 }
]

// ------------------------------------------------------------
// 8. 送りがな（小2〜）: 正しい送りがなを選ぶ
// ------------------------------------------------------------
export const OKURIGANA = [
  { reading: 'あたらしい', correct: '新しい', distractors: ['新らしい', '新たしい'], rule: '「新（あたら）」の後ろ、読み方が変わり始めるところからひらがなで書くよ。', minGrade: 2 },
  { reading: 'うつくしい', correct: '美しい', distractors: ['美くしい', '美つくしい'], rule: '「美（うつく）」の後ろ、読み方が変わり始めるところからひらがなで書くよ。', minGrade: 2 },
  { reading: 'はしる', correct: '走る', distractors: ['走しる', '走はしる'], rule: '動きを表す言葉は、最後の音（る・う・く など）だけをひらがなにするよ。', minGrade: 2 },
  { reading: 'あかるい', correct: '明るい', distractors: ['明かるい', '明るるい'], rule: '「明（あか）」の後ろからひらがなで書くよ。', minGrade: 2 },
  { reading: 'かんがえる', correct: '考える', distractors: ['考がえる', '考んがえる'], rule: '「考（かんが）」の後ろの読み方が変わる部分からひらがなにするよ。', minGrade: 3 },
  { reading: 'たしかめる', correct: '確かめる', distractors: ['確しかめる', '確たしかめる'], rule: '「確（たし）」の後ろからひらがなで書くよ。', minGrade: 3 },
  { reading: 'あらわす', correct: '表す', distractors: ['表あらわす', '表らわす'], rule: '「表（あらわ）」の後ろの読み方が変わる部分からひらがなにするよ。', minGrade: 3 },
  { reading: 'こころよい', correct: '快い', distractors: ['快よい', '快こころよい'], rule: '「快（こころよ）」の後ろからひらがなで書くよ。', minGrade: 4 },
  { reading: 'したがう', correct: '従う', distractors: ['従がう', '従したがう'], rule: '「従（したが）」の後ろの読み方が変わる部分からひらがなにするよ。', minGrade: 4 },
  { reading: 'あたためる', correct: '温める', distractors: ['温かためる', '温ためる'], rule: '「温（あたた）」の後ろからひらがなで書くよ。', minGrade: 4 },
  { reading: 'すこやかだ', correct: '健やかだ', distractors: ['健こやかだ', '健すこやかだ'], rule: '「健（すこ）」の後ろの読み方が変わる部分からひらがなにするよ。', minGrade: 5 },
  { reading: 'こころざす', correct: '志す', distractors: ['志こころざす', '志ざす'], rule: '「志（こころざ）」の後ろからひらがなで書くよ。', minGrade: 5 },
  { reading: 'ふたたび', correct: '再び', distractors: ['再たび', '再ふたたび'], rule: '「再（ふたた）」の後ろの読み方が変わる部分からひらがなにするよ。', minGrade: 5 },
  { reading: 'いちじるしい', correct: '著しい', distractors: ['著るしい', '著いちじるしい'], rule: '「著（いちじる）」の後ろからひらがなで書くよ。', minGrade: 6 },
  { reading: 'あやまつ', correct: '過つ', distractors: ['過あやまつ', '過まつ'], rule: '「過（あやま）」の後ろの読み方が変わる部分からひらがなにするよ。', minGrade: 6 },
  { reading: 'こころみる', correct: '試みる', distractors: ['試こころみる', '試みみる'], rule: '「試（こころ）」の後ろからひらがなで書くよ。', minGrade: 6 }
]

// ------------------------------------------------------------
// 9. 主語・述語・修飾語（小3〜）: 文の骨組み
// ------------------------------------------------------------
export const GRAMMAR = [
  { sentence: '赤い　花が　さいた。', tokens: ['赤い', '花が', 'さいた'], subject: 1, predicate: 2, modifier: 0, minGrade: 3 },
  { sentence: '弟が　大きな　声で　笑った。', tokens: ['弟が', '大きな', '声で', '笑った'], subject: 0, predicate: 3, modifier: 1, minGrade: 3 },
  { sentence: '白い　犬が　庭を　走る。', tokens: ['白い', '犬が', '庭を', '走る'], subject: 1, predicate: 3, modifier: 0, minGrade: 3 },
  { sentence: '姉は　毎朝　早く　起きる。', tokens: ['姉は', '毎朝', '早く', '起きる'], subject: 0, predicate: 3, modifier: 2, minGrade: 3 },
  { sentence: '古い　時計が　止まった。', tokens: ['古い', '時計が', '止まった'], subject: 1, predicate: 2, modifier: 0, minGrade: 3 },
  { sentence: '兄は　やさしい　人だ。', tokens: ['兄は', 'やさしい', '人だ'], subject: 0, predicate: 2, modifier: 1, minGrade: 4 },
  { sentence: '小さな　鳥が　高く　飛んだ。', tokens: ['小さな', '鳥が', '高く', '飛んだ'], subject: 1, predicate: 3, modifier: 0, minGrade: 4 },
  { sentence: '母が　台所で　夕食を　作る。', tokens: ['母が', '台所で', '夕食を', '作る'], subject: 0, predicate: 3, modifier: 1, minGrade: 4 },
  { sentence: '青い　海が　静かに　広がる。', tokens: ['青い', '海が', '静かに', '広がる'], subject: 1, predicate: 3, modifier: 0, minGrade: 4 },
  { sentence: '妹は　きのう　新しい　本を　読んだ。', tokens: ['妹は', 'きのう', '新しい', '本を', '読んだ'], subject: 0, predicate: 4, modifier: 1, minGrade: 5 },
  { sentence: '先生の話は、とても分かりやすかった。', tokens: ['先生の', '話は', 'とても', '分かりやすかった'], subject: 1, predicate: 3, modifier: 0, minGrade: 5 },
  { sentence: '祖父は　若いころ　船乗りだった。', tokens: ['祖父は', '若いころ', '船乗りだった'], subject: 0, predicate: 2, modifier: 1, minGrade: 5 },
  { sentence: '委員会は　新しい　規則を　決定した。', tokens: ['委員会は', '新しい', '規則を', '決定した'], subject: 0, predicate: 3, modifier: 1, minGrade: 6 },
  { sentence: '研究者たちは　長年　この　現象を　調べてきた。', tokens: ['研究者たちは', '長年', 'この', '現象を', '調べてきた'], subject: 0, predicate: 4, modifier: 1, minGrade: 6 }
]

// ------------------------------------------------------------
// 10. 敬語（小5〜）
// ------------------------------------------------------------
export const KEIGO = [
  { plain: '行く', sonkeigo: 'いらっしゃる', kenjougo: 'まいる', teineigo: '行きます', minGrade: 5 },
  { plain: '食べる', sonkeigo: 'めしあがる', kenjougo: 'いただく', teineigo: '食べます', minGrade: 5 },
  { plain: '言う', sonkeigo: 'おっしゃる', kenjougo: '申す', teineigo: '言います', minGrade: 5 },
  { plain: '見る', sonkeigo: 'ご覧になる', kenjougo: '拝見する', teineigo: '見ます', minGrade: 5 },
  { plain: '来る', sonkeigo: 'いらっしゃる', kenjougo: 'まいる', teineigo: '来ます', minGrade: 5 },
  { plain: 'する', sonkeigo: 'なさる', kenjougo: 'いたす', teineigo: 'します', minGrade: 6 },
  { plain: '聞く', sonkeigo: 'お聞きになる', kenjougo: 'うかがう', teineigo: '聞きます', minGrade: 6 },
  { plain: '知る', sonkeigo: 'ご存じだ', kenjougo: '存じる', teineigo: '知っています', minGrade: 6 },
  { plain: 'もらう', sonkeigo: 'お受け取りになる', kenjougo: 'いただく', teineigo: 'もらいます', minGrade: 6 },
  { plain: '会う', sonkeigo: 'お会いになる', kenjougo: 'お目にかかる', teineigo: '会います', minGrade: 6 }
]

// ------------------------------------------------------------
// 11. 短文読解（小3〜）: 100〜200字の文＋設問1つ
// ------------------------------------------------------------
export const DOKKAI = [
  {
    passage: 'あさ、公園に行くと、犬をつれたおじいさんに会った。犬は白くて、しっぽを大きくふっていた。「かわいいですね」と話しかけると、おじいさんは「この子は、毎朝ここを散歩するのが日課なんですよ」とにこにこしながら教えてくれた。',
    question: 'おじいさんは、どんな様子で答えましたか。',
    choices: ['にこにこしながら', 'こまった顔で', 'いそいでいた', '何も言わなかった'],
    answer: 'にこにこしながら',
    explain: '文の最後「にこにこしながら教えてくれた」に、そのまま答えが書かれているよ。文中の言葉をそのまま探すのが短文読解のコツだよ。',
    minGrade: 3
  },
  {
    passage: 'たろうは、算数のテストで100点を取った。うれしくて家に帰り、お母さんにテストを見せた。すると、お母さんは「がんばったね」と頭をなでてくれた。たろうは、次のテストももっとがんばろうと思った。',
    question: 'たろうが「次もがんばろう」と思ったのは、なぜですか。',
    choices: ['お母さんにほめられてうれしかったから', 'テストが簡単だったから', '先生に注意されたから', 'friendにさそわれたから'],
    answer: 'お母さんにほめられてうれしかったから',
    explain: '「がんばったね」とほめられ「うれしくて」の後に「次もがんばろう」と続いているね。理由は、直前の出来事や気持ちの中に書かれていることが多いよ。',
    minGrade: 3
  },
  {
    passage: '雨の日、かさを忘れたゆうたは、こまっていた。すると、となりのクラスのみさきさんが「いっしょに入る？」とかさをさし出してくれた。ゆうたは「ありがとう」と言って、みさきさんとならんで歩いた。',
    question: 'ゆうたが「こまっていた」のは、なぜですか。',
    choices: ['かさを忘れたから', 'テストがあったから', '道に迷ったから', 'みさきさんとけんかしたから'],
    answer: 'かさを忘れたから',
    explain: '文の最初に「かさを忘れたゆうたは、こまっていた」と、原因と結果が同じ文の中に書かれているよ。指示語や接続語の前後を見比べると理由が見つかるよ。',
    minGrade: 3
  },
  {
    passage: '森の中に、小さな池がある。その池には、毎年春になるとカエルが卵を産みに集まってくる。今年も、たくさんのおたまじゃくしが泳ぐ姿が見られた。しかし、夏になると池の水が減ってしまい、心配する声も上がっている。',
    question: '「しかし」の後に書かれているのは、どんな内容ですか。',
    choices: ['前の内容とは逆の、心配な出来事', '前の内容と同じ、うれしい出来事', 'まったく関係のない話題', '前の文をくりかえした内容'],
    answer: '前の内容とは逆の、心配な出来事',
    explain: '「しかし」は前の文と逆の内容が続くことを示す接続語だよ。おたまじゃくしが見られた良い話のあとに、水が減る心配な話が続いているね。',
    minGrade: 4
  },
  {
    passage: '図書館で借りた本を読んでいたら、その本のシリーズがとても面白いことに気づいた。次の週、続きを借りようと図書館に行くと、貸し出し中だった。しかたなく、それは予約をして、別の本を借りて帰った。',
    question: '「それ」が指しているのは、何ですか。',
    choices: ['シリーズの続きの本', '図書館', '前に読んだ本', '別の本'],
    answer: 'シリーズの続きの本',
    explain: '「それ」のすぐ前の文を見ると「続きを借りようと図書館に行く」とあるね。指示語（これ・それ・あれ）は、直前に出てきた言葉を指すことが多いよ。',
    minGrade: 4
  },
  {
    passage: '祖母の家には、古い柱時計がある。もう何十年も動いていて、今でも正確に時を刻んでいる。祖父が生きていたころから大切にされてきたその時計は、家族にとって、ただの時計ではなく、祖父との思い出そのものなのだ。',
    question: '「ただの時計ではなく」と筆者が考える理由として、最も合うものはどれですか。',
    choices: ['祖父との思い出がつまっているから', '値段がとても高いから', '動かなくなってしまったから', '新しく買ったばかりだから'],
    answer: '祖父との思い出がつまっているから',
    explain: '直後に「祖父との思い出そのものなのだ」と、筆者の考える理由がはっきり書かれているね。文末の「〜のだ」は、理由や結論を強調する言い方だよ。',
    minGrade: 4
  },
  {
    passage: '海の生き物には、体の色を変えられるものがいる。例えばタコは、まわりの岩や砂の色に合わせて、数秒で体の色を変えることができる。これは、天敵から身をかくしたり、獲物に気づかれずに近づいたりするためだと考えられている。',
    question: 'タコが体の色を変えられるのは、何のためだと考えられていますか。',
    choices: ['身をかくしたり、獲物に近づいたりするため', '仲間と会話するため', '暑さや寒さから身を守るため', '人間に見つけてもらうため'],
    answer: '身をかくしたり、獲物に近づいたりするため',
    explain: '最後の文に「〜だと考えられている」と、理由がまとめて書かれているね。説明文では、最後の文に筆者の考えがまとめられることが多いよ。',
    minGrade: 5
  },
  {
    passage: '江戸時代、人々は手紙を送るのに「飛脚（ひきゃく）」という仕事の人にたよっていた。飛脚は、街道を走って手紙や荷物を運んだ。江戸から京都までの約500キロメートルを、速いときは3日ほどで走りぬいたという記録も残っている。',
    question: '飛脚は、何を運んでいましたか。',
    choices: ['手紙や荷物', '人だけ', '食べ物だけ', 'お金だけ'],
    answer: '手紙や荷物',
    explain: '一文目に「手紙や荷物を運んだ」と、はっきり書かれているね。説明文では最初の文に大事な内容がまとめられていることが多いよ。',
    minGrade: 5
  },
  {
    passage: '近年、プラスチックごみが海の生き物に深刻な影響をあたえていることが分かってきた。海に流れ出たプラスチックは、細かくくだけても自然には分解されにくく、長い間海の中に残り続ける。それを魚が食べてしまう事例も報告されている。',
    question: 'プラスチックごみが問題になっている理由として、文中に書かれているのはどれですか。',
    choices: ['分解されにくく、魚が食べてしまうから', '値段が高いから', 'すぐに消えてなくなるから', '見た目が悪いから'],
    answer: '分解されにくく、魚が食べてしまうから',
    explain: '「自然には分解されにくく」「魚が食べてしまう事例」という二つの事実が、問題の理由として並べて書かれているね。理由を問う問題は、文中の事実を並べて整理しよう。',
    minGrade: 5
  },
  {
    passage: '「言葉は生き物だ」と言われることがある。時代とともに新しい言葉が生まれ、逆に使われなくなって消えていく言葉もあるからだ。例えば、昔当たり前だった言い方が、今の子どもには通じないこともある。だからといって、古い言葉がすべて価値を失うわけではない。',
    question: '筆者が「言葉は生き物だ」と言っているのは、どのような意味ですか。',
    choices: ['言葉が時代とともに生まれたり消えたりするから', '言葉には命があるから', '言葉が実際に動き回るから', '言葉が食べ物を必要とするから'],
    answer: '言葉が時代とともに生まれたり消えたりするから',
    explain: '直後に「時代とともに新しい言葉が生まれ、逆に使われなくなって消えていく」と、たとえの理由が説明されているね。比喩表現は、その直後の説明を読むと意味が分かるよ。',
    minGrade: 6
  },
  {
    passage: '日本には四季があり、それぞれの季節に合わせた行事や食べ物が受けつがれてきた。しかし、近年は気候の変化によって、桜の開花時期が早まったり、夏の暑さがきびしくなったりしている。こうした変化は、昔からの季節の感覚にも少しずつ影響をあたえ始めている。',
    question: '筆者がこの文章で伝えようとしていることに、最も近いのはどれですか。',
    choices: ['気候の変化が季節の感覚にも影響し始めていること', '日本には四季があること自体', '桜の開花を毎年楽しみにしていること', '夏はいつも暑いということ'],
    answer: '気候の変化が季節の感覚にも影響し始めていること',
    explain: '「しかし」のあとに書かれている内容が、この文章で筆者が特に伝えたい話題だよ。最後の一文が、その内容をまとめているね。',
    minGrade: 6
  },
  {
    passage: '選挙で投票することは、国民の権利であると同時に、社会をよりよくするための大切な手段でもある。投票に行かなければ、自分の考えを政治に伝える機会を失うことになる。だからこそ、一票の重みを理解し、自分の意思で投票先を選ぶことが求められている。',
    question: 'この文章で、投票に行くことの大切さの理由として書かれているのはどれですか。',
    choices: ['自分の考えを政治に伝える機会になるから', '投票するとお金がもらえるから', '学校の宿題だから', '友達に誘われたから'],
    answer: '自分の考えを政治に伝える機会になるから',
    explain: '「投票に行かなければ、自分の考えを政治に伝える機会を失う」の部分を裏返すと、投票に行く理由が分かるね。否定文のうしろに、大切な理由がかくれていることがあるよ。',
    minGrade: 6
  }
]

// ------------------------------------------------------------
// 共通ビルダー
// ------------------------------------------------------------
function meaningChoiceQuestion({ itemKey, visualText, instruction, speak, answerText, explain, distractorPool, distractorOf, choiceCount }) {
  const distractors = shuffle(poolDistractors(distractorPool.self, distractorPool.exclude, distractorOf, choiceCount - 1))
  // プールが小さい学年帯では、他形式に頼らず学年を広げて補う。
  const options = shuffle([answerText, ...distractors])
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: distractorPool.unitId,
    itemKey,
    visual: { kind: 'word', text: visualText },
    instruction,
    speak,
    answerId: answerText,
    choices: options.map((text) => ({ id: text, label: text })),
    answerWord: { text: answerText },
    explain
  }
}

function unitIdForGrade(grade) { return `reading:${grade}:language` }

function idiomQuestion(item, params) {
  const pool = eligible(IDIOMS, params.grade || 0)
  return meaningChoiceQuestion({
    itemKey: `idiom:${item.phrase}`,
    visualText: item.phrase,
    instruction: '意味を えらぼう',
    speak: `「${item.phrase}」の 意味は どれかな？`,
    answerText: item.meaning,
    explain: `「${item.phrase}」は「${item.meaning}」という意味だよ。${item.note}`,
    distractorPool: { self: pool, exclude: item, unitId: unitIdForGrade(params.grade || 0) },
    distractorOf: (it) => it.meaning,
    choiceCount: params.choiceCount || 4
  })
}

function proverbQuestion(item, params) {
  const pool = eligible(PROVERBS, params.grade || 0)
  return meaningChoiceQuestion({
    itemKey: `proverb:${item.phrase}`,
    visualText: item.phrase,
    instruction: '意味を えらぼう',
    speak: `「${item.phrase}」の 意味は どれかな？`,
    answerText: item.meaning,
    explain: `「${item.phrase}」は「${item.meaning}」という意味のことわざだよ。${item.note}`,
    distractorPool: { self: pool, exclude: item, unitId: unitIdForGrade(params.grade || 0) },
    distractorOf: (it) => it.meaning,
    choiceCount: params.choiceCount || 4
  })
}

function yojiQuestion(item, params) {
  const pool = eligible(YOJI, params.grade || 0)
  return meaningChoiceQuestion({
    itemKey: `yoji:${item.word}`,
    visualText: item.word,
    instruction: '意味を えらぼう',
    speak: `「${item.word}」の 意味は どれかな？`,
    answerText: item.meaning,
    explain: `「${item.word}」は「${item.meaning}」という意味の四字熟語だよ。${item.note}`,
    distractorPool: { self: pool, exclude: item, unitId: unitIdForGrade(params.grade || 0) },
    distractorOf: (it) => it.meaning,
    choiceCount: params.choiceCount || 4
  })
}

function antonymQuestion(item, params) {
  const pool = eligible(ANTONYMS, params.grade || 0)
  return meaningChoiceQuestion({
    itemKey: `anto:${item.word}`,
    visualText: item.word,
    instruction: '反対の意味の言葉を えらぼう',
    speak: `「${item.word}」の 反対の意味の言葉は どれかな？`,
    answerText: item.opposite,
    explain: `「${item.word}」の対義語は「${item.opposite}」だよ。${item.usage}のように、意味が反対になる場面で使い分けよう。`,
    distractorPool: { self: pool, exclude: item, unitId: unitIdForGrade(params.grade || 0) },
    distractorOf: (it) => it.opposite,
    choiceCount: params.choiceCount || 4
  })
}

function synonymQuestion(item, params) {
  const pool = eligible(SYNONYMS, params.grade || 0)
  return meaningChoiceQuestion({
    itemKey: `syno:${item.word}`,
    visualText: item.word,
    instruction: '似た意味の言葉を えらぼう',
    speak: `「${item.word}」と 似た意味の言葉は どれかな？`,
    answerText: item.synonym,
    explain: `「${item.word}」の類義語は「${item.synonym}」だよ。${item.usage}のように、言いかえても意味がほぼ変わらないよ。`,
    distractorPool: { self: pool, exclude: item, unitId: unitIdForGrade(params.grade || 0) },
    distractorOf: (it) => it.synonym,
    choiceCount: params.choiceCount || 4
  })
}

function homophoneQuestion(item, params) {
  const grade = params.grade || 0
  const choiceCount = params.choiceCount || 4
  // 同じ読みの選択肢を土台に、他の同音異義語セットの漢字も混ぜて選択肢数を確保する。
  const own = item.options.map((o) => o.kanji)
  const otherPool = eligible(HOMOPHONES, grade).filter((h) => h !== item).flatMap((h) => h.options.map((o) => o.kanji))
  const extra = shuffle([...new Set(otherPool)].filter((k) => !own.includes(k))).slice(0, Math.max(0, choiceCount - own.length))
  const options = shuffle([...own, ...extra])
  const matched = item.options.find((o) => o.kanji === item.correctKanji)
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: unitIdForGrade(grade),
    itemKey: `homo:${item.kana}:${item.correctKanji}`,
    visual: { kind: 'sentence', text: item.sentence },
    instruction: '（　）に あう 漢字を えらぼう',
    speak: `${item.sentence.replaceAll('○○', 'なになに')} この 文に あう 漢字は どれかな？`,
    answerId: item.correctKanji,
    choices: options.map((k) => ({ id: k, label: k })),
    answerWord: { text: item.correctKanji },
    explain: `ここでは「${item.correctKanji}」が正しいよ。「${item.correctKanji}」は「${matched?.meaning}」という意味だから、この文の内容に合うんだ。`
  }
}

function radicalQuestion(item, params) {
  const grade = params.grade || 0
  const pool = eligible(RADICALS, grade)
  return meaningChoiceQuestion({
    itemKey: `bushu:${item.kanji}`,
    visualText: item.kanji,
    instruction: '部首を えらぼう',
    speak: `「${item.kanji}」の 部首は どれかな？`,
    answerText: item.radical,
    explain: `「${item.kanji}」の部首は「${item.radical}」だよ。${item.hint}。`,
    distractorPool: { self: pool, exclude: item, unitId: unitIdForGrade(grade) },
    distractorOf: (it) => it.radical,
    choiceCount: params.choiceCount || 4
  })
}

function okuriganaQuestion(item, params) {
  const grade = params.grade || 0
  const choiceCount = params.choiceCount || 4
  const wrongFromOthers = choiceCount - 1 - item.distractors.length
  const otherPool = eligible(OKURIGANA, grade).filter((o) => o !== item).map((o) => o.correct)
  const extra = wrongFromOthers > 0 ? shuffle(otherPool).slice(0, wrongFromOthers) : []
  const options = shuffle([item.correct, ...item.distractors, ...extra])
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: unitIdForGrade(grade),
    itemKey: `okuri:${item.reading}`,
    visual: { kind: 'word', text: item.reading },
    instruction: '正しい 送りがなを えらぼう',
    speak: `「${item.reading}」の 正しい 書き方は どれかな？`,
    answerId: item.correct,
    choices: options.map((text) => ({ id: text, label: text })),
    answerWord: { text: item.correct },
    explain: `正しくは「${item.correct}」だよ。${item.rule}`
  }
}

function grammarQuestion(item, params) {
  const grade = params.grade || 0
  const roles = [
    { key: 'subject', label: '主語（だれが／なにが）', index: item.subject },
    { key: 'predicate', label: '述語（どうする／どんなだ）', index: item.predicate }
  ]
  if (item.modifier != null) roles.push({ key: 'modifier', label: '修飾語（くわしくする言葉）', index: item.modifier })
  const role = roles[Math.floor(Math.random() * roles.length)]
  const options = shuffle(item.tokens)
  const ruleText = {
    subject: '主語は「だれが／なにが」にあたる言葉で、多くは「〜が」「〜は」の形になるよ。',
    predicate: '述語は「どうする／どんなだ」にあたる言葉で、文の最後にくることが多いよ。',
    modifier: '修飾語は、他の言葉をくわしく説明する言葉だよ。'
  }[role.key]
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: unitIdForGrade(grade),
    itemKey: `bunpo:${item.sentence}:${role.key}`,
    visual: { kind: 'sentence', text: item.sentence },
    instruction: `${role.label}を えらぼう`,
    speak: `この 文の ${role.label}は どれかな？`,
    answerId: item.tokens[role.index],
    choices: options.map((text) => ({ id: text, label: text })),
    answerWord: { text: item.tokens[role.index] },
    explain: `${role.label}は「${item.tokens[role.index]}」だよ。${ruleText}`
  }
}

// 復習キーで「尊敬語・謙譲語」の種類を固定して敬語問題を再生成する。
function keigoQuestionForced(item, params, formKey) {
  const grade = params.grade || 0
  const forms = {
    sonkeigo: { key: 'sonkeigo', label: '尊敬語（相手の動作を高める言い方）', value: item.sonkeigo, rule: '相手や目上の人の動作をうやまって高める言い方だよ。' },
    kenjougo: { key: 'kenjougo', label: '謙譲語（自分の動作をへりくだる言い方）', value: item.kenjougo, rule: '自分や身内の動作を低くして、相手をうやまう言い方だよ。' }
  }
  const form = forms[formKey]
  if (!form) return null
  const pool = eligible(KEIGO, grade).filter((k) => k !== item)
  const sameKindWrong = pool.map((k) => k[form.key])
  const otherKindWrong = [item[form.key === 'sonkeigo' ? 'kenjougo' : 'sonkeigo'], item.teineigo, item.plain]
  const distractors = shuffle([...new Set([...sameKindWrong, ...otherKindWrong])].filter((v) => v && v !== form.value)).slice(0, (params.choiceCount || 4) - 1)
  const options = shuffle([form.value, ...distractors])
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: unitIdForGrade(grade),
    itemKey: `keigo:${item.plain}:${form.key}`,
    visual: { kind: 'word', text: item.plain },
    instruction: `${form.label}を えらぼう`,
    speak: `「${item.plain}」を ${form.label}に すると どれかな？`,
    answerId: form.value,
    choices: options.map((text) => ({ id: text, label: text })),
    answerWord: { text: form.value },
    explain: `「${item.plain}」の${form.label}は「${form.value}」だよ。${form.rule}`
  }
}

// 形式ごとのレジストリ。reviewKey の接頭辞と、未出優先プールの構築に使う。
// keigo/bunpo は「1項目から複数の設問（役割・敬語の種類）」が作れるため、
// ここには含めず、それぞれ専用のプール展開・復習キー処理を持つ。
const LANGUAGE_FORMS = [
  { prefix: 'idiom:', pool: IDIOMS, build: idiomQuestion, keyOf: (it) => `idiom:${it.phrase}` },
  { prefix: 'proverb:', pool: PROVERBS, build: proverbQuestion, keyOf: (it) => `proverb:${it.phrase}` },
  { prefix: 'yoji:', pool: YOJI, build: yojiQuestion, keyOf: (it) => `yoji:${it.word}` },
  { prefix: 'anto:', pool: ANTONYMS, build: antonymQuestion, keyOf: (it) => `anto:${it.word}` },
  { prefix: 'syno:', pool: SYNONYMS, build: synonymQuestion, keyOf: (it) => `syno:${it.word}` },
  { prefix: 'homo:', pool: HOMOPHONES, build: homophoneQuestion, keyOf: (it) => `homo:${it.kana}:${it.correctKanji}` },
  { prefix: 'bushu:', pool: RADICALS, build: radicalQuestion, keyOf: (it) => `bushu:${it.kanji}` },
  { prefix: 'okuri:', pool: OKURIGANA, build: okuriganaQuestion, keyOf: (it) => `okuri:${it.reading}` }
]

/**
 * 語彙・慣用句系の新形式をまとめて1問生成する（未出優先）。
 */
export function generateLanguageQuestion(params, reviewKey = null) {
  const grade = params.grade || 0
  if (reviewKey) {
    for (const form of LANGUAGE_FORMS) {
      if (!reviewKey.startsWith(form.prefix)) continue
      const item = form.pool.find((it) => form.keyOf(it) === reviewKey)
      if (item) return form.build(item, params)
    }
    if (reviewKey.startsWith('bunpo:')) {
      const [, sentence, roleKey] = reviewKey.split(':')
      const item = GRAMMAR.find((g) => g.sentence === sentence)
      if (item) {
        const q = grammarQuestionForced(item, params, roleKey)
        if (q) return q
      }
    }
    if (reviewKey.startsWith('keigo:')) {
      const [, plain, formKey] = reviewKey.split(':')
      const item = KEIGO.find((k) => k.plain === plain)
      if (item) {
        const q = keigoQuestionForced(item, params, formKey)
        if (q) return q
      }
    }
  }

  const everSeen = params.everSeenKnowledge
  // 文法は「文＋役割」、敬語は「単語＋敬語の種類」の組み合わせで
  // knowledgeId が変わるため、候補をあらかじめ展開する。
  const grammarPool = eligible(GRAMMAR, grade).flatMap((item) => {
    const roles = ['subject', 'predicate', ...(item.modifier != null ? ['modifier'] : [])]
    return roles.map((role) => ({ item, role, key: `bunpo:${item.sentence}:${role}` }))
  })
  const keigoPool = eligible(KEIGO, grade).flatMap((item) => (
    ['sonkeigo', 'kenjougo'].map((formKey) => ({ item, formKey, key: `keigo:${item.plain}:${formKey}` }))
  ))

  const buckets = [
    ...LANGUAGE_FORMS.map((form) => ({ form, items: eligible(form.pool, grade) })),
    { form: { keyOf: (g) => g.key, build: (g, p) => grammarQuestionForced(g.item, p, g.role) }, items: grammarPool },
    { form: { keyOf: (k) => k.key, build: (k, p) => keigoQuestionForced(k.item, p, k.formKey) }, items: keigoPool }
  ].filter((bucket) => bucket.items.length)

  if (!buckets.length) return null
  // 形式ごとにプールの大きさが違うため、均等にバケツを選ぶだけでは
  // 小さいプール（例: 四字熟語14件）が先に一巡し、他の形式にまだ未出が
  // 残っていても既出の再出題が始まってしまう。未出が残るバケツがあれば
  // そちらだけから選び、全バケツが一巡したときだけ完全ランダムに戻す。
  const withUnseen = everSeen ? buckets.filter((b) => b.items.some((item) => !everSeen.has(b.form.keyOf(item)))) : []
  const pickFrom = withUnseen.length ? withUnseen : buckets
  const bucket = pickFrom[Math.floor(Math.random() * pickFrom.length)]
  const chosen = pickUnseenFirst(bucket.items, everSeen, bucket.form.keyOf)
  return bucket.form.build(chosen, params)
}

// 復習キーで役割を固定して文法問題を再生成する。
function grammarQuestionForced(item, params, roleKey) {
  const grade = params.grade || 0
  const roles = { subject: '主語（だれが／なにが）', predicate: '述語（どうする／どんなだ）', modifier: '修飾語（くわしくする言葉）' }
  const index = { subject: item.subject, predicate: item.predicate, modifier: item.modifier }[roleKey]
  if (index == null) return null
  const label = roles[roleKey]
  const options = shuffle(item.tokens)
  const ruleText = {
    subject: '主語は「だれが／なにが」にあたる言葉で、多くは「〜が」「〜は」の形になるよ。',
    predicate: '述語は「どうする／どんなだ」にあたる言葉で、文の最後にくることが多いよ。',
    modifier: '修飾語は、他の言葉をくわしく説明する言葉だよ。'
  }[roleKey]
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: unitIdForGrade(grade),
    itemKey: `bunpo:${item.sentence}:${roleKey}`,
    visual: { kind: 'sentence', text: item.sentence },
    instruction: `${label}を えらぼう`,
    speak: `この 文の ${label}は どれかな？`,
    answerId: item.tokens[index],
    choices: options.map((text) => ({ id: text, label: text })),
    answerWord: { text: item.tokens[index] },
    explain: `${label}は「${item.tokens[index]}」だよ。${ruleText}`
  }
}

/**
 * 短文読解を1問生成する（未出優先）。
 */
export function generateDokkaiQuestion(params, reviewKey = null) {
  const grade = params.grade || 0
  if (reviewKey && reviewKey.startsWith('dokkai:')) {
    const passage = DOKKAI.find((d) => `dokkai:${d.passage.slice(0, 12)}` === reviewKey)
    if (passage) return dokkaiQuestionFrom(passage, params)
  }
  const everSeen = params.everSeenKnowledge
  const pool = eligible(DOKKAI, grade)
  if (!pool.length) return null
  const chosen = pickUnseenFirst(pool, everSeen, (d) => `dokkai:${d.passage.slice(0, 12)}`)
  return dokkaiQuestionFrom(chosen, params)
}

function dokkaiQuestionFrom(item, params) {
  const grade = params.grade || 0
  const options = shuffle(item.choices)
  return {
    domain: 'yomu',
    type: 'choice',
    unitId: `reading:${grade}:dokkai`,
    itemKey: `dokkai:${item.passage.slice(0, 12)}`,
    visual: { kind: 'passage', text: item.passage },
    instruction: item.question,
    speak: `文章を よんで、しつもんに こたえよう。${item.question}`,
    answerId: item.answer,
    choices: options.map((text) => ({ id: text, label: text })),
    answerWord: { text: item.answer },
    explain: item.explain
  }
}
