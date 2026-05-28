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

// 为必须食材分配每周覆盖（鱼每周只出现1次）
function assignWeeklyCoverage(dayCount) {
  const numWeeks = Math.ceil(dayCount / 5)
  const coverage = []

  for (let w = 0; w < numWeeks; w++) {
    const nonFish = MANDATORY_INGREDIENTS.filter(i => i !== '鱼')
    const shuffled = shuffle(nonFish)
    const weekDays = Math.min(5, dayCount - w * 5)

    // 鱼固定在某一天（随机选择）
    const fishDay = Math.floor(Math.random() * weekDays)

    const assignments = []
    for (let d = 0; d < weekDays; d++) {
      const req = []
      if (d === fishDay) req.push('鱼')
      // 每天至少1类（非鱼），某天多1类
      req.push(shuffled[d % shuffled.length])
      assignments.push({ day: d, required: req })
    }

    // 多余的类别随机分配（防止牛羊同日）
    const used = new Set(assignments.map(a => a.required).flat())
    const remaining = MANDATORY_INGREDIENTS.filter(i => !used.has(i))
    for (const ing of remaining) {
      // 避免牛肉和羊肉分到同一天
      let targetDay
      if (ing === '羊肉') {
        const safeDays = assignments.filter(a => !a.required.includes('牛肉'))
        targetDay = safeDays.length > 0
          ? assignments.indexOf(safeDays[Math.floor(Math.random() * safeDays.length)])
          : Math.floor(Math.random() * weekDays)
      } else if (ing === '牛肉') {
        const safeDays = assignments.filter(a => !a.required.includes('羊肉'))
        targetDay = safeDays.length > 0
          ? assignments.indexOf(safeDays[Math.floor(Math.random() * safeDays.length)])
          : Math.floor(Math.random() * weekDays)
      } else {
        targetDay = Math.floor(Math.random() * weekDays)
      }
      assignments[targetDay].required.push(ing)
    }

    // 偶尔允许某周少1类（15%概率，但不能少鱼）
    if (Math.random() < 0.12) {
      const nonFishDay = assignments.find(a => !a.required.includes('鱼'))
      if (nonFishDay && nonFishDay.required.length > 1) {
        nonFishDay.required.pop()
      }
    }

    coverage.push(assignments)
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

  // 第一步：满足当天必须食材（牛羊不同日、允许偶尔跳过1个）
  const skipMandatory = Math.random() < 0.12 && requiredIngredients.length > 1
  let toPick = skipMandatory ? requiredIngredients.slice(0, -1) : [...requiredIngredients]

  // 强制牛羊不同日
  if (toPick.includes('牛肉') && toPick.includes('羊肉')) {
    toPick = toPick.filter(i => i !== '羊肉')  // 移除羊肉，保留牛肉
  }

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

    // 先强制主料不重复
    let unique = candidates.filter(d => !usedIngredientsToday.has(d.mainIngredient))
    if (unique.length > 0) candidates = unique

    // 牛羊互斥：已有牛肉时排除羊肉，反之亦然
    if (usedIngredientsToday.has('牛肉')) {
      candidates = candidates.filter(d => d.mainIngredient !== '羊肉')
    }
    if (usedIngredientsToday.has('羊肉')) {
      candidates = candidates.filter(d => d.mainIngredient !== '牛肉')
    }

    // 鱼限频：非必须食材日不选鱼
    const isFishRequired = requiredIngredients.includes('鱼')
    const fishAlreadyPicked = usedIngredientsToday.has('鱼')
    if (!isFishRequired || fishAlreadyPicked) {
      candidates = candidates.filter(d => d.mainIngredient !== '鱼')
      if (candidates.length === 0) {
        candidates = meatPool.filter(d => !usedIds.has(d.id) && !usedIngredientsToday.has(d.mainIngredient))
      }
    }

    // 主题偏好筛选（在唯一性约束之后）
    if (theme.ingredientPref?.length && selected.length < TARGET - 1) {
      const themed = candidates.filter(d => theme.ingredientPref.includes(d.mainIngredient))
      if (themed.length >= 2) candidates = themed
    }
    if (theme.cuisinePref?.length && candidates.length > 2) {
      const themed = candidates.filter(d => theme.cuisinePref.includes(d.cuisine))
      if (themed.length >= 2) candidates = themed
    }

    if (candidates.length === 0) {
      candidates = meatPool.filter(d => !usedIds.has(d.id) && !usedIngredientsToday.has(d.mainIngredient))
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
  const usedIngredientsToday = new Set()
  const TARGET = MEALS_PER_DAY.VEGETABLE
  let sichuanCount = 0
  const baseSichuanTarget = 2
  const sichuanTarget = theme.sichuanBoost > 1.0 ? baseSichuanTarget : theme.sichuanBoost < 0.3 ? Math.max(baseSichuanTarget - 1, 0) : baseSichuanTarget

  for (let i = 0; i < TARGET; i++) {
    // 品类不重复优先
    let candidates = vegPool.filter(d =>
      !usedIds.has(d.id) && !usedIngredientsToday.has(d.mainIngredient)
    )
    if (candidates.length === 0) {
      candidates = vegPool.filter(d => !usedIds.has(d.id))
    }

    // 主题偏好
    if (theme.methodPref?.length && candidates.length > 2) {
      const themed = candidates.filter(d => theme.methodPref.includes(d.cookingMethod))
      if (themed.length >= 2) candidates = themed
    }

    if (candidates.length === 0) break

    const ctx = buildContext(theme, { sichuanCount, sichuanTarget, usedIngredientsToday, selectedSoFar: selected, dayIndex })
    const dish = weightedPick(candidates, ctx)
    if (dish) {
      selected.push(dish)
      usedIds.add(dish.id)
      usedIngredientsToday.add(dish.mainIngredient)
      if (dish.cuisine === '川菜') sichuanCount++
    }
  }

  // 牛肉羊肉不共存：如果同时选中，强制替换羊肉
  let hasBeef = selected.some(d => d.mainIngredient === '牛肉')
  let hasLamb = selected.some(d => d.mainIngredient === '羊肉')
  if (hasBeef && hasLamb) {
    const lambIdx = selected.findIndex(d => d.mainIngredient === '羊肉')
    usedIds.delete(selected[lambIdx].id)
    usedIngredientsToday.delete(selected[lambIdx].mainIngredient)

    // 优先找猪肉/鸡肉/鸭肉/海鲜/鹅（非牛羊非鱼）
    const preferred = ['猪肉','鸡','鸭','海鲜','鹅']
    let replacement = meatPool.find(d =>
      !usedIds.has(d.id) && !usedIngredientsToday.has(d.mainIngredient) &&
      preferred.includes(d.mainIngredient)
    )
    if (!replacement) {
      replacement = meatPool.find(d =>
        !usedIds.has(d.id) && !usedIngredientsToday.has(d.mainIngredient) &&
        d.mainIngredient !== '牛肉' && d.mainIngredient !== '羊肉'
      )
    }
    if (replacement) {
      usedIds.add(replacement.id)
      usedIngredientsToday.add(replacement.mainIngredient)
      selected[lambIdx] = replacement
    } else {
      // 无法替换，移除羊肉，尝试从任何可用肉中补充
      selected.splice(lambIdx, 1)
      const extra = meatPool.find(d => !usedIds.has(d.id) && !usedIngredientsToday.has(d.mainIngredient))
      if (extra) {
        selected.push(extra)
        usedIds.add(extra.id)
        usedIngredientsToday.add(extra.mainIngredient)
      }
    }
  }

  return selected
}

// 选择面食
function selectStapleForDay({ staplePool, usedIds, theme }) {
  let candidates = staplePool.filter(d => !usedIds.has(d.id))

  if (theme.name === '清淡日') {
    const light = candidates.filter(d => d.spiciness <= 1)
    if (light.length > 0) candidates = light
  } else if (theme.name === '川味日') {
    const spicy = candidates.filter(d => d.spiciness >= 3)
    if (spicy.length > 0) candidates = spicy
  }

  if (candidates.length === 0) {
    candidates = staplePool.filter(d => !usedIds.has(d.id))
  }
  if (candidates.length === 0) return null

  const dish = candidates[Math.floor(Math.random() * candidates.length)]
  usedIds.add(dish.id)
  return dish
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
function generateOneMonth({ meatPool, vegPool, staplePool, usedIds, workdays }) {
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

      const dayStaple = selectStapleForDay({
        staplePool, usedIds, theme
      })

      weekPlan.push({ meat: dayMeat, veg: dayVeg, staple: dayStaple, theme: theme.name })
      dayIdx++
    }
    plan.push(weekPlan)
  }

  // 最终去重检查：如果同一个月出现相同菜品，强制替换
  const allUsedInMonth = new Map() // id → {week, day, type, index}
  plan.forEach((week, wi) => {
    week.forEach((day, di) => {
      day.meat.forEach((dish, si) => {
        if (allUsedInMonth.has(dish.id)) {
          // 重复了！找一个未用过的替换
          const replacement = findReplacement(dish, meatPool, allUsedInMonth, usedIds)
          if (replacement) {
            usedIds.delete(dish.id)
            usedIds.add(replacement.id)
            day.meat[si] = replacement
          }
        }
        allUsedInMonth.set(dish.id, { week: wi, day: di })
      })
      day.veg.forEach((dish, si) => {
        if (allUsedInMonth.has(dish.id)) {
          const replacement = findReplacement(dish, vegPool, allUsedInMonth, usedIds)
          if (replacement) {
            usedIds.delete(dish.id)
            usedIds.add(replacement.id)
            day.veg[si] = replacement
          }
        }
        allUsedInMonth.set(dish.id, { week: wi, day: di })
      })
      // 面食去重
      if (day.staple) {
        const dish = day.staple
        if (allUsedInMonth.has(dish.id)) {
          const replacement = findReplacement(dish, staplePool, allUsedInMonth, usedIds)
          if (replacement) {
            usedIds.delete(dish.id)
            usedIds.add(replacement.id)
            day.staple = replacement
          }
        }
        allUsedInMonth.set(dish.id, { week: wi, day: di })
      }
    })
  })

  return plan
}

// 为重复菜品找替换
function findReplacement(original, pool, usedMap, usedIds) {
  const candidates = pool.filter(d =>
    !usedIds.has(d.id) &&
    d.mainIngredient === original.mainIngredient &&
    d.type === original.type
  )
  if (candidates.length === 0) {
    // 放宽：同类型即可
    const fallback = pool.filter(d => !usedIds.has(d.id) && d.type === original.type)
    if (fallback.length > 0) return fallback[Math.floor(Math.random() * fallback.length)]
    return null
  }
  return candidates[Math.floor(Math.random() * candidates.length)]
}

// 统计单月数据
function computeStats(monthPlan) {
  const allDishes = monthPlan.flat().flatMap(d => [...d.meat, ...d.veg, d.staple].filter(Boolean))
  const ids = allDishes.map(d => d.id)
  const uniqueIds = new Set(ids)
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)

  return {
    totalDishes: allDishes.length,
    totalMeat: allDishes.filter(d => d.type === 'meat').length,
    totalVeg: allDishes.filter(d => d.type === 'vegetable').length,
    totalStaple: allDishes.filter(d => d.type === 'staple').length,
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

    // 根据冷却期筛选（川菜1月、面食1月、其他2月）
    const sichuanCooldown = Math.max(1, coolingMonths - 1)
    const otherCooldown = coolingMonths
    const availableDishes = dishDB.filter(d => {
      const lastUsed = history[d.id]
      if (!lastUsed) return true
      let cd = otherCooldown
      if (d.cuisine === '川菜') cd = sichuanCooldown
      if (d.type === 'staple') cd = 1  // 面食冷却1个月
      return monthsBetween(lastUsed, monthKey) >= cd
    })

    const meatPool = availableDishes.filter(d => d.type === 'meat')
    const vegPool = availableDishes.filter(d => d.type === 'vegetable')
    const staplePool = availableDishes.filter(d => d.type === 'staple')
    const usedIds = new Set()
    const workdays = getWorkdayDates(year, month)

    if (workdays.length === 0) {
      allPlans.push({ year, month, plan: [], stats: { totalDishes: 0, note: '无工作日' } })
      continue
    }

    const plan = generateOneMonth({ meatPool, vegPool, staplePool, usedIds, workdays })
    const stats = computeStats(plan)

    // 更新使用记录
    plan.flat().forEach(day => {
      const dishes = [...day.meat, ...day.veg]
      if (day.staple) dishes.push(day.staple)
      dishes.forEach(dish => {
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
