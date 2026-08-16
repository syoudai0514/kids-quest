// Design-only source of truth for the first Codex art pilot.  This module is
// consumed by validation and image-production tooling, never by the app.
import { MONSTER_BY_ID } from '../../src/data/monsters.js'
import { MONSTER_MASTER_BY_ID } from '../../src/data/monsterMaster/monsterMaster.js'
import { FAMILY_PLANS } from '../../src/data/monsterMaster/familyPlan.js'

export const DESIGN_PROMPT_VERSION = 'monster-v2-pilot-2'

const FAMILY_ART = Object.freeze({
  'family-core-orbit': ['軌道を回る星核と岩装甲', ['光る菱形の核', '3枚の軌道石', '角ばった眉'], ['小さな岩灯', '電気を帯びた装甲輪', '闇に浮く完成軌道']],
  'family-sky-metamorph': ['炎の幼鳥から柔らかな星竜への変態', ['炎羽の冠', '節状の翼意匠', '渦巻く尾'], ['跳ねる炎の幼鳥', '風を切る虫/繭の中間体', '流星ジェルをまとう小型竜']],
  'family-galaxy-pulse': ['銀河の鼓動をためる浮遊生物', ['渦巻く銀河腹', '脈打つ丸いひれ', '左右非対称の光点'], ['鼓動が見える半透明の単独種']],
  'family-ancient-sand': ['砂丘から起きる古生物', ['化石の背板', '砂時計形の瞳', '短く太い尾'], ['低い姿勢で踏ん張る砂の恐竜']],
  'family-green-beacon': ['森を照らす植物星', ['苔むした星核', '葉のアンテナ', '灯台状の腹紋'], ['上へ伸びる光を持つ単独種']],
  'family-snow-bastion': ['雪岩の守護砦', ['六角の雪結晶板', '低い重心', '片側だけ大きい盾腕'], ['丸い雪玉ではなく歩く岩砦']],
  'family-rainbow-mirage': ['虹を映す幻影', ['プリズム面の仮面', '細いリボン尾', '色がずれる影'], ['友好的すぎない横目の浮遊霊']],
  'family-cosmic-wing': ['宇宙を渡る黒翼鳥', ['三日月の翼端', '胸の小宇宙', '彗星状の尾羽'], ['小さくてもボスと分かる王冠状の角']],
  'family-pilot-aurora-shell': ['極光をためる可変殻', ['三日月の殻板', '紫から青の極光線', '二股の触角'], ['殻を背負う小虫', '殻が溶けた中間体', '殻を翼へ開く完成体']],
  'family-pilot-tidal-seed': ['潮と芽を循環させる種', ['真珠の種核', '渦巻く水線', '芽形の背びれ'], ['水辺の幼体', '芽が光を集める中間体', '氷殻で種を守る完成体']],
  'family-pilot-shadow-wing': ['影を折り畳む翼鎧', ['割れた仮面', '稲妻の血管模様', '翼に見える外套'], ['岩影の浮遊体', '電気をまとう飛行体', '翼鎧を閉じる闇の虫体']],
  'family-pilot-flare-gel': ['炎を冷まし育つ柔体獣', ['雫形の炎角', '半透明の腹層', '輪になった足跡紋'], ['小さな火のジェル', '骨格が生える中間体', '熱を制御する星殻体']],
  'family-pilot-bloom-orbit': ['花と銀河を回す庭園核', ['花弁の軌道輪', '種の瞳孔', '蔓のしっぽ'], ['花星の幼体', '砂の輪を持つ中間体', '緑の浮遊庭園体']],
  'family-pilot-snow-flight': ['雪雲を縫う虫竜', ['氷針の触角', '雲形の翼穴', '虹色の尾節'], ['小さな雪虫', '虹の翼を広げる中間体', '宇宙雲を泳ぐ柔体竜']],
  'family-pilot-moon-core': ['月核を守る太陽装甲', ['欠けた月の核', '放射状の背板', '左右で太さの違う腕'], ['月滴の幼体', '太陽背板の中間体', 'マグマ装甲の完成体']],
  'family-pilot-river-spirit': ['川から森へ移る精霊殻', ['水輪の首飾り', '葉脈状の亀裂', '一枚だけ長い耳/角'], ['水岩の幼体', '草の浮遊精霊', '氷羽で川を守る完成体']],
  'family-pilot-stone-spark': ['石火花を運ぶ双節虫', ['鋸歯の石板', '黄色い関節光', '短い二本尾'], ['重い石虫', '発電する柔体の完成形']],
  'family-pilot-fire-sky': ['火種を空へ運ぶ小獣', ['炎滴の腹紋', '空色の背筋', '跳ね上がる尾'], ['丸い火種体', '空を走る恐竜体']],
  'family-pilot-dino-flower': ['古代花を守る岩竜', ['つぼみ形の角', '化石葉の鱗', '花粉をためる頬袋'], ['若い花竜', '岩花が開いた守護体']],
  'family-pilot-galaxy-sand': ['銀河砂をまとう夜鳥', ['砂粒の星斑', '細い三角翼', '流砂の尾羽'], ['小さな銀河霊', '砂嵐を切る鳥体']],
  'family-pilot-green-snow': ['緑芽を雪で包む繭', ['葉形の節', '白い外殻', '青い呼吸孔'], ['走る緑虫', '雪の繭になる完成体']],
  'family-pilot-cosmic-drop': ['宇宙を映す一滴獣', ['深紺の滴形', '一周する光輪', '小さな流星尾'], ['地面に触れず浮く単独種']],
  'family-pilot-star-dino': ['星屑を食べる古代獣', ['星形の歯列', '太い後脚', '尾端の光る石'], ['前傾姿勢の小型恐竜']],
  'family-pilot-moon-lantern': ['月明かりを運ぶ灯星', ['提灯状の星核', '欠け月の耳', '淡い輪の足'], ['丸いだけでなく下方へ伸びる単独種']],
  'family-pilot-solar-crag': ['太陽熱を蓄える歩行岩', ['放射状の亀裂', '台形の頭部', '橙の結晶かかと'], ['上半身が大きい岩の単独種']]
})

const BODY_ARCHETYPE = Object.freeze({
  blob: '浮遊する柔体',
  dino: '低重心の二足古生物',
  star: '放射形の星核生物',
  rock: '非対称の装甲岩獣',
  ghost: '裾が分かれた浮遊霊',
  bird: '翼と尾羽が明瞭な飛行獣',
  bug: '節の見える多足/有翼虫',
  slime: '伸縮する接地柔体'
})

const SILHOUETTE_GROUP = Object.freeze({
  blob: 'round-float',
  dino: 'heavy-biped',
  star: 'radial-core',
  rock: 'angular-tank',
  ghost: 'tapered-float',
  bird: 'wide-wing',
  bug: 'segmented-wide',
  slime: 'low-fluid'
})

const PERSONALITIES = Object.freeze([
  '慎重だが芯が強い',
  '好奇心旺盛で少しいたずら',
  '無口で周りをよく見る',
  '負けず嫌いで勇敢',
  'のんびり見えて判断が速い',
  '堂々として近寄りがたい'
])

const ELEMENT_STRUCTURE_CUE = Object.freeze({
  いわ: '肩から背中へ粗い六角岩板が段差をつくる',
  でんき: '関節を結ぶ黄色い稲妻線が脈のように発光する',
  やみ: '胸の暗い空洞から紫の輪郭光だけが漏れる',
  ほのお: '額の炎角から尾へ赤橙の温度グラデーションが走る',
  そら: '空色の薄膜と白い風切り突起が左右へ広がる',
  きょうりゅう: '骨質の眉角と太い後脚が古代獣の重さを見せる',
  ぎんが: '腹部の渦紋に青紫の星粒が奥行きをもって浮かぶ',
  すな: '背面の砂層が風下へ崩れる非対称な段丘をつくる',
  みどり: '葉脈の通る芽板が背骨に沿って上向きに並ぶ',
  ゆき: '半透明の六角雪板が片側の肩と腕を厚く覆う',
  にじ: 'プリズム面ごとに赤青緑の反射位置が少しずれる',
  うちゅう: '胸の深紺空間を細い軌道輪と微小な星が巡る',
  ほし: '中心核から長短の違う光条が五方向へ伸びる',
  つき: '欠け月形の淡い核が片側だけを銀色に照らす',
  マグマ: '黒い外殻の割れ目から橙色の溶岩光がのぞく',
  みず: '体側を一周する水流線に真珠状の泡が連なる',
  くさ: '胸元の種核から二色の蔓と若葉が枝分かれする',
  こおり: '青白い氷柱が先端ほど透明になる層構造を持つ',
  はな: '角のつぼみから大小の花弁が螺旋状に開く',
  たいよう: '背板の放射溝が中心から金橙色へ順に輝く'
})

const BODY_DETAIL_CUE = Object.freeze({
  blob: '丸い胴の左右で大きさの違うひれが浮遊方向を示す',
  dino: '太い後脚と低い頭、接地する尾先で三角の重心をつくる',
  star: '長さの異なる五本の突起と小さな下脚で放射輪郭をつくる',
  rock: '大きな盾腕と小さな握り腕を対比させ台形の輪郭をつくる',
  ghost: '割れた仮面から細い裾が三方向へ流れる輪郭をつくる',
  bird: '三日月形の翼端と長短二層の尾羽で飛行線をつくる',
  bug: '二股触角と節ごとに太さの違う脚で横長の輪郭をつくる',
  slime: '低い接地面から一方へ伸びる透明な尾で流動感をつくる'
})

function artForFamily(familyId) {
  const art = FAMILY_ART[familyId]
  if (!art) throw new Error(`Missing pilot family art direction: ${familyId}`)
  return { motif: art[0], inheritedDesignCues: art[1], stageArc: art[2] }
}

const pilotPlans = FAMILY_PLANS.filter((plan) => plan.source === 'pilot-51-100')

export const DESIGN_MANIFEST_051_100 = Object.freeze(pilotPlans.flatMap((plan, familyIndex) => {
  const art = artForFamily(plan.id)
  return plan.memberIds.map((monsterId, stageIndex) => {
    const identity = MONSTER_BY_ID[monsterId]
    const runtime = MONSTER_MASTER_BY_ID[monsterId]
    return Object.freeze({
      monsterId,
      dexNo: runtime.dexNo,
      name: identity.name,
      description: identity.desc,
      element: identity.element,
      familyId: plan.id,
      stage: runtime.stage,
      maxStage: runtime.maxStage,
      bodyArchetype: BODY_ARCHETYPE[identity.art],
      motif: art.motif,
      silhouetteGroup: SILHOUETTE_GROUP[identity.art],
      personality: PERSONALITIES[(familyIndex + stageIndex) % PERSONALITIES.length],
      inheritedDesignCues: Object.freeze([...art.inheritedDesignCues]),
      uniqueDesignCues: Object.freeze([
        `${identity.name}は${art.stageArc[Math.min(stageIndex, art.stageArc.length - 1)]}の姿を取る`,
        ELEMENT_STRUCTURE_CUE[identity.element],
        BODY_DETAIL_CUE[identity.art]
      ]),
      forbiddenSimilarityNotes: Object.freeze([
        '既存ゲーム・アニメの特定キャラクター、捕獲道具、ロゴに似せない',
        `${art.motif}を単純な丸顔マスコットへ置き換えない`,
        `${identity.name}の${BODY_ARCHETYPE[identity.art]}は同じ顔・輪郭の色替えにしない`
      ]),
      framing: Object.freeze({ ratio: '1:1', safeMarginPercent: 12, pose: '正面〜少し斜めの全身単体' }),
      assetTargets: Object.freeze({
        source: `design/monsters/source/${monsterId}.png`,
        thumb: `/monsters/thumb/${monsterId}.webp`,
        full: `/monsters/full/${monsterId}.webp`,
        forms: Object.freeze(Object.fromEntries(Object.entries(runtime.forms).map(([kind, form]) => [kind, form.asset])))
      }),
      promptVersion: DESIGN_PROMPT_VERSION,
      qa: Object.freeze({ status: 'planned', reviewer: 'Codex Sol', notes: [] })
    })
  })
}))

export const DESIGN_MANIFEST_BY_ID = Object.freeze(Object.fromEntries(
  DESIGN_MANIFEST_051_100.map((entry) => [entry.monsterId, entry])
))
