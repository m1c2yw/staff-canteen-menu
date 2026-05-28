// 菜单核心生成算法 v2 — 多月生成 + 冷却期 + 主题系统
import {
  MANDATORY_INGREDIENTS,
  MEALS_PER_DAY
} from '../data/constants.js'
import { scoreDish, weightedPick } from './scorer.js'

// 每日主题类型
const DAY_THEMES = [
  { name: '川味日', prob: 0.30, sichuanBoost: 2.5, spiceShift: +1.5, cuisinePref: ['川菜'], methodPref: ['炒','烧','煮','炸'] },
  { name: '清淡日', prob: 0.22, sichuanBoost: 0.2, spiceShift: -1.5, cuisinePref: ['粤菜','苏菜','浙菜','闽菜'], methodPref: ['蒸','煮','炒','拌'] },
  { name: '海鲜日', prob: 0.15, sichuanBoost: 0.5, spiceShift: -0.5, cuisinePref: ['粤菜','闽菜','鲁菜','川菜'], ingredientPref: ['海鲜'], methodPref: ['蒸','炒','煮'] },
  { name: '硬菜日', prob: 0.18, sichuanBoost: 0.8, spiceShift: 0, cuisinePref: ['川菜','湘菜','东北菜','西北菜'], methodPref: ['烧','炖','焖','烤','卤'] },
  { name: '普通日', prob: 0.15, sichuanBoost: 1.0, spiceShift: 0, cuisinePref: [], methodPref: [] }
]

// 构建累积概率
let cumProb = 0
DAY_THEMES.forEach(t => { cumProb += t.prob; t._cumProb = cumProb })

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 获取某月的工作日列表
function getWorkdayDates(year, month) {
  const dates = []
  const d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) {
    const dow = d.getDay()
    if (dow >= 1 && dow <= 5) dates.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

// 随机选择每日主题
function pickTheme() {
  const r = Math.random()
  for (const t of DAY_THEMES) {
    if (r <= t._cumProb) return t
  }
  return DAY_THEMES[DAY_THEMES.length - 1]
}

// 计算两个年月字符串之间的月份差
function monthsBetween(a, b) {
  const [ya, ma] = a.split('-').map(Number)
  const [yb, mb] = b.split('-').map(Number)
  return (yb - ya) * 12 + (mb - ma)
}

// 为必须食材分配每周覆盖（放松版：允许单周缺失1类）
function assignWeeklyCoverage(dayCount) {
  const numWeeks = Math.ceil(dayCount / 5)
  const coverage = []
  let categoryPool = shuffle([...MANDATORY_INGREDIENTS])

  for (let w = 0; w < numWeeks; w++) {
    // 偶尔允许某周少覆盖1类（概率15%）
    const skipOne = Math.random() < 0.15 && categoryPool.length >= 5
    const weekCategories = skipOne ? categoryPool.slice(0, 5) : categoryPool.slice(0, Math.min(6, categoryPool.length))

    const weekDays = Math.min(5, dayCount - w * 5)
    const assignments = []
    for (let d = 0; d < weekDays; d++) {
      assignments.push({ day: d, required: [weekCategories[d] || categoryPool[d % categoryPool.length]] })
    }
    // 多余类别分配给随机天
    for (let i = weekDays; i < weekCategories.length; i++) {
      const targetDay = Math.floor(Math.random() * weekDays)
      assignments[targetDay].required.push(weekCategories[i])
    }

    coverage.push(assignments)
    // 旋转类别池以便下周不同
    categoryPool = shuffle([...MANDATORY_INGREDIENTS])
  }

  return coverage
}

// 构建评分上下文（融入主题）
function buildContext(theme, baseContext = {}) {
  const ctx = { ...baseContext, theme }
  // 根据主题调整川菜目标
  if (theme.sichuanBoost > 1.0) {
    ctx.sichuanTarget = Math.min(Math.ceil(ctx.sichuanTarget || 2) + 1, 4)
  } else if (theme.sichuanBoost < 0.5) {
    ctx.sichuanTarget = Math.max((ctx.sichuanTarget || 2) - 1, 0)
  }
  return ctx
}

// 为某一天选择荤菜（主题版）
function selectMeatForDay({ meatPool, usedIds, requiredIngredients, theme, dayIndex }) {
  const selected = []
  const usedIngredientsToday = new Set()
  let sichuanCount = 0
  const TARGET = MEALS_PER_DAY.MEAT
  const baseSichuanTarget = 3
  const sichuanTarget = theme.sichuanBoost > 1.0 ? baseSichuanTarget : theme.sichuanBoost < 0.3 ? Math.max(baseSichuanTarget - 2, 1) : baseSichuanTarget

  // 第一步：满足当天必须食材（允许偶尔跳过1个，15%概率）
  const skipMandatory = Math.random() < 0.12 && requiredIngredients.length > 1
  const toPick = skipMandatory ? requiredIngredients.slice(0, -1) : requiredIngredients

  for (const reqIng of toPick) {
    let candidates = meatPool.filter(d =>
      d.mainIngredient === reqIng && !usedIds.has(d.id) && !usedIngredientsToday.has(d.mainIngredient)
    )
    if (candidates.length === 0) {
      candidates = meatPool.filter(d => d.mainIngredient === reqIng && !usedIds.has(d.id))
    }
    if (candidates.length === 0) continue

    const ctx = buildContext(theme, { sichuanCount, sichuanTarget, usedIngredientsToday, selectedSoFar: selected, dayIndex })
    const dish = weightedPick(candidates, ctx)
    if (dish) {
      selected.push(dish)
      usedIds.add(dish.id)
      usedIngredientsToday.add(dish.mainIngredient)
      if (dish.cuisine === '川菜') sichuanCount++
    }
  }

  // 第二步：补充剩余荤菜
  let attempts = 0
  while (selected.length < TARGET && attempts < 100) {
    attempts++
    let candidates = meatPool.filter(d => !usedIds.has(d.id))

    // 主题偏好筛选
    if (theme.ingredientPref?.length && selected.length < TARGET - 1) {
      const themed = candidates.filter(d => theme.ingredientPref.includes(d.mainIngredient))
      if (themed.length >= 2) candidates = themed
    }
    if (theme.cuisinePref?.length) {
      const themed = candidates.filter(d => theme.cuisinePref.includes(d.cuisine))
      if (themed.length >= 2) candidates = themed
    }

    // 主料不重复（放松：允许偶尔重复，20%概率跳过）
    if (Math.random() > 0.2) {
      const unique = candidates.filter(d => !usedIngredientsToday.has(d.mainIngredient))
      if (unique.length > 0) candidates = unique
    }

    if (candidates.length === 0) {
      candidates = meatPool.filter(d => !usedIds.has(d.id))
    }
    if (candidates.length === 0) break

    const ctx = buildContext(theme, { sichuanCount, sichuanTarget, usedIngredientsToday, selectedSoFar: selected, dayIndex })
    const dish = weightedPick(candidates, ctx)
    if (dish) {
      selected.push(dish)
      usedIds.add(dish.id)
      usedIngredientsToday.add(dish.mainIngredient)
      if (dish.cuisine === '川菜') sichuanCount++
    } else break
  }

  return selected
}

// 为某一天选择素菜（主题版）
function selectVegForDay({ vegPool, usedIds, theme, dayIndex }) {
  const selected = []
  const TARGET = MEALS_PER_DAY.VEGETABLE
  let sichuanCount = 0
  const baseSichuanTarget = 2
  const sichuanTarget = theme.sichuanBoost > 1.0 ? baseSichuanTarget : theme.sichuanBoost < 0.3 ? Math.max(baseSichuanTarget - 1, 0) : baseSichuanTarget

  for (let i = 0; i < TARGET; i++) {
    let candidates = vegPool.filter(d => !usedIds.has(d.id))

    // 主题偏好
    if (theme.methodPref?.length) {
      const themed = candidates.filter(d => theme.methodPref.includes(d.cookingMethod))
      if (themed.length >= 2) candidates = themed
    }

    if (candidates.length === 0) {
      candidates = vegPool.filter(d => !usedIds.has(d.id))
    }
    if (candidates.length === 0) break

    const ctx = buildContext(theme, { sichuanCount, sichuanTarget, usedIngredientsToday: new Set(), selectedSoFar: selected, dayIndex })
    const dish = weightedPick(candidates, ctx)
    if (dish) {
      selected.push(dish)
      usedIds.add(dish.id)
      if (dish.cuisine === '川菜') sichuanCount++
    }
  }

  return selected
}

// 回退模式
function selectMeatRelaxed({ meatPool, usedIds, requiredIngredients }) {
  const selected = []
  const usedIngredientsToday = new Set()
  for (const reqIng of requiredIngredients) {
    const candidates = meatPool.filter(d => d.mainIngredient === reqIng && !usedIds.has(d.id))
    if (candidates.length > 0) {
      const dish = candidates[Math.floor(Math.random() * candidates.length)]
      selected.push(dish)
      usedIds.add(dish.id)
      usedIngredientsToday.add(dish.mainIngredient)
    }
  }
  const remaining = shuffle(meatPool.filter(d => !usedIds.has(d.id)))
  for (const dish of remaining) {
    if (selected.length >= MEALS_PER_DAY.MEAT) break
    if (!usedIds.has(dish.id)) {
      selected.push(dish)
      usedIds.add(dish.id)
    }
  }
  return selected
}

// 生成单月菜单
function generateOneMonth({ meatPool, vegPool, usedIds, workdays }) {
  const dayCount = workdays.length
  const coverage = assignWeeklyCoverage(dayCount)
  const plan = []

  let dayIdx = 0
  for (let w = 0; w < coverage.length; w++) {
    const weekPlan = []
    for (let d = 0; d < coverage[w].length; d++) {
      const dayRequired = coverage[w][d].required
      const theme = pickTheme()

      let dayMeat = selectMeatForDay({
        meatPool, usedIds,
        requiredIngredients: dayRequired,
        theme, dayIndex: dayIdx
      })

      if (dayMeat.length < MEALS_PER_DAY.MEAT) {
        const retry = selectMeatRelaxed({ meatPool, usedIds, requiredIngredients: dayRequired })
        if (retry.length > dayMeat.length) dayMeat = retry
      }

      const dayVeg = selectVegForDay({
        vegPool, usedIds,
        theme, dayIndex: dayIdx
      })

      weekPlan.push({ meat: dayMeat, veg: dayVeg, theme: theme.name })
      dayIdx++
    }
    plan.push(weekPlan)
  }

  return plan
}

// 统计单月数据
function computeStats(monthPlan) {
  const allDishes = monthPlan.flat().flatMap(d => [...d.meat, ...d.veg])
  const ids = allDishes.map(d => d.id)
  const uniqueIds = new Set(ids)
  // 检查跨月也不重复
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)

  return {
    totalDishes: allDishes.length,
    totalMeat: allDishes.filter(d => d.type === 'meat').length,
    totalVeg: allDishes.filter(d => d.type === 'vegetable').length,
    sichuanRatio: allDishes.filter(d => d.cuisine === '川菜').length / allDishes.length,
    uniqueCount: uniqueIds.size,
    avgSpiciness: (allDishes.reduce((s, d) => s + d.spiciness, 0) / allDishes.length).toFixed(1),
    withinMonthDupes: duplicates.length > 0 ? duplicates : []
  }
}

// ===== 主入口 =====

/**
 * 生成多个月份的菜单
 * @param {Array} dishDB - 所有菜品
 * @param {Object} options
 *   - startYear, startMonth: 起始年月
 *   - numMonths: 生成几个月（默认1）
 *   - coolingMonths: 冷却期月数（默认3）
 *   - usedHistory: 已有使用记录 { dishId: '2026-5' }
 * @returns {Array<{ year, month, plan, stats }>}
 */
export function generateMonths(dishDB, options = {}) {
  const {
    startYear = 2026,
    startMonth = 5,
    numMonths = 1,
    coolingMonths = 3,
    usedHistory = {}
  } = options

  const allPlans = []
  const history = { ...usedHistory }

  for (let m = 0; m < numMonths; m++) {
    const totalMonth = startMonth + m
    const year = startYear + Math.floor((totalMonth - 1) / 12)
    const month = ((totalMonth - 1) % 12) + 1
    const monthKey = `${year}-${month}`

    // 根据冷却期筛选可用菜品（川菜冷却1个月，其他2个月）
    const sichuanCooldown = Math.max(1, coolingMonths - 1)
    const otherCooldown = coolingMonths
    const availableDishes = dishDB.filter(d => {
      const lastUsed = history[d.id]
      if (!lastUsed) return true
      const cd = d.cuisine === '川菜' ? sichuanCooldown : otherCooldown
      return monthsBetween(lastUsed, monthKey) >= cd
    })

    const meatPool = availableDishes.filter(d => d.type === 'meat')
    const vegPool = availableDishes.filter(d => d.type === 'vegetable')
    const usedIds = new Set()
    const workdays = getWorkdayDates(year, month)

    if (workdays.length === 0) {
      allPlans.push({ year, month, plan: [], stats: { totalDishes: 0, note: '无工作日' } })
      continue
    }

    const plan = generateOneMonth({ meatPool, vegPool, usedIds, workdays })
    const stats = computeStats(plan)

    // 更新使用记录
    plan.flat().forEach(day => {
      ;[...day.meat, ...day.veg].forEach(dish => {
        history[dish.id] = monthKey
      })
    })

    allPlans.push({ year, month, plan, stats, workdays })
  }

  return { allPlans, usedHistory: history }
}

// 向后兼容的单月生成
export function generateMonth(dishDB, options = {}) {
  const result = generateMonths(dishDB, {
    startYear: options.year || 2026,
    startMonth: options.month || 5,
    numMonths: 1,
    usedHistory: options.usedHistory || {}
  })
  const month = result.allPlans[0]
  return {
    monthPlan: month.plan,
    statistics: month.stats,
    usedHistory: result.usedHistory
  }
}
