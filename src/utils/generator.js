// 菜单核心生成算法
import {
  MANDATORY_INGREDIENTS,
  MEALS_PER_DAY,
  WORKDAYS_PER_WEEK,
  WEEKS_PER_MONTH,
  SICHUAN_TARGET_RATIO
} from '../data/constants.js'
import { weightedPick } from './scorer.js'
import { validateMenu } from './validator.js'

/**
 * Fisher-Yates 洗牌算法
 */
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 为每周分配必须食材到各天
 * 6类食材分配进5天，某一天承担2类
 * @returns {Array<{ day: number, required: string[] }>}
 */
function assignWeeklyCoverage() {
  const categories = shuffle([...MANDATORY_INGREDIENTS])
  const assignments = []
  for (let day = 0; day < 5; day++) {
    assignments.push({ day, required: [categories[day]] })
  }
  // 第6个类别随机分配到某一天（使该天承担2类）
  const extraDay = Math.floor(Math.random() * 5)
  assignments[extraDay].required.push(categories[5])
  return assignments
}

/**
 * 为某一天选择荤菜
 */
function selectMeatForDay({ meatPool, usedIds, requiredIngredients, sichuanRatio, lockedIds }) {
  let selected = []
  const usedIngredientsToday = new Set()
  let sichuanCount = 0
  const TARGET = MEALS_PER_DAY.MEAT
  const sichuanTarget = Math.ceil(TARGET * sichuanRatio)

  // 第一步：满足当天必须食材要求
  for (const reqIng of requiredIngredients) {
    let candidates = meatPool.filter(d =>
      d.mainIngredient === reqIng &&
      !usedIds.has(d.id) &&
      !usedIngredientsToday.has(d.mainIngredient)
    )

    // 放宽：允许相同主料但不同菜
    if (candidates.length === 0) {
      candidates = meatPool.filter(d =>
        d.mainIngredient === reqIng &&
        !usedIds.has(d.id)
      )
    }

    if (candidates.length === 0) continue

    const dish = weightedPick(candidates, {
      sichuanCount,
      sichuanTarget,
      usedIngredientsToday,
      selectedSoFar: selected
    })

    if (dish) {
      selected.push(dish)
      usedIds.add(dish.id)
      usedIngredientsToday.add(dish.mainIngredient)
      if (dish.cuisine === '川菜') sichuanCount++
    }
  }

  // 第二步：补充剩余荤菜至4道
  let attempts = 0
  while (selected.length < TARGET && attempts < 100) {
    attempts++

    // 优先选和当天已有主料不同的
    let candidates = meatPool.filter(d =>
      !usedIds.has(d.id) &&
      !usedIngredientsToday.has(d.mainIngredient)
    )

    // 如果不够，放宽不重复主料约束
    if (candidates.length === 0) {
      candidates = meatPool.filter(d => !usedIds.has(d.id))
    }

    if (candidates.length === 0) break

    const dish = weightedPick(candidates, {
      sichuanCount,
      sichuanTarget,
      usedIngredientsToday,
      selectedSoFar: selected
    })

    if (dish) {
      selected.push(dish)
      usedIds.add(dish.id)
      usedIngredientsToday.add(dish.mainIngredient)
      if (dish.cuisine === '川菜') sichuanCount++
    } else {
      break
    }
  }

  // 第三步：确保川菜数量达标（荤菜至少2道川菜）
  selected = enforceSichuanMinimum(selected, meatPool, usedIds, 2)

  return selected
}

/**
 * 确保选中菜品中川菜数量达到最低要求
 * 如果不足，尝试将非川菜替换为川菜
 */
function enforceSichuanMinimum(selected, pool, usedIds, minimum) {
  const sichuanCount = selected.filter(d => d.cuisine === '川菜').length
  if (sichuanCount >= minimum) return selected

  let needed = minimum - sichuanCount
  const result = [...selected]
  const usedIngredients = new Set(result.map(d => d.mainIngredient))

  // 找出可替换的非川菜位置（非必须食材的）
  for (let i = 0; i < result.length && needed > 0; i++) {
    if (result[i].cuisine === '川菜') continue

    // 寻找川菜替代品（不同主料）
    const candidates = pool.filter(d =>
      d.cuisine === '川菜' &&
      d.type === result[i].type &&
      !usedIds.has(d.id) &&
      !usedIngredients.has(d.mainIngredient)
    )

    if (candidates.length > 0) {
      // 回退旧菜
      usedIds.delete(result[i].id)
      const replacement = candidates[Math.floor(Math.random() * candidates.length)]
      result[i] = replacement
      usedIds.add(replacement.id)
      usedIngredients.add(replacement.mainIngredient)
      needed--
    }
  }

  return result
}

/**
 * 为某一天选择素菜
 */
function selectVegForDay({ vegPool, usedIds, meatIngredientsToday, sichuanRatio }) {
  const selected = []
  const TARGET = MEALS_PER_DAY.VEGETABLE
  const sichuanTarget = Math.ceil(TARGET * sichuanRatio)
  let sichuanCount = 0

  for (let i = 0; i < TARGET; i++) {
    let candidates = vegPool.filter(d => !usedIds.has(d.id))

    // 避免与荤菜主料名称重叠
    const usedIngredients = new Set(meatIngredientsToday)
    const uniqueCandidates = candidates.filter(d => !usedIngredients.has(d.mainIngredient))

    const pool = uniqueCandidates.length >= TARGET - i ? uniqueCandidates : candidates

    if (pool.length === 0) break

    const dish = weightedPick(pool, {
      sichuanCount,
      sichuanTarget,
      usedIngredientsToday: new Set(),
      selectedSoFar: selected
    })

    if (dish) {
      selected.push(dish)
      usedIds.add(dish.id)
      if (dish.cuisine === '川菜') sichuanCount++
    }
  }

  // 确保素菜至少1道川菜
  return enforceSichuanMinimum(selected, vegPool, usedIds, 1)
}

/**
 * 回退模式：放宽约束生成
 */
function selectMeatRelaxed({ meatPool, usedIds, requiredIngredients }) {
  const selected = []
  const usedIngredientsToday = new Set()

  // 尽量满足必须食材
  for (const reqIng of requiredIngredients) {
    const candidates = meatPool.filter(d =>
      d.mainIngredient === reqIng && !usedIds.has(d.id)
    )
    if (candidates.length > 0) {
      const dish = candidates[Math.floor(Math.random() * candidates.length)]
      selected.push(dish)
      usedIds.add(dish.id)
      usedIngredientsToday.add(dish.mainIngredient)
    }
  }

  // 补充至4道
  const remaining = shuffle(meatPool.filter(d => !usedIds.has(d.id)))
  for (const dish of remaining) {
    if (selected.length >= MEALS_PER_DAY.MEAT) break
    if (!usedIngredientsToday.has(dish.mainIngredient)) {
      selected.push(dish)
      usedIds.add(dish.id)
      usedIngredientsToday.add(dish.mainIngredient)
    }
  }

  // 如果还不够，忽略主料不重复约束
  if (selected.length < MEALS_PER_DAY.MEAT) {
    for (const dish of remaining) {
      if (selected.length >= MEALS_PER_DAY.MEAT) break
      if (!usedIds.has(dish.id)) {
        selected.push(dish)
        usedIds.add(dish.id)
      }
    }
  }

  return selected
}

/**
 * 生成整月菜单
 * @param {Array} dishDB - 所有菜品数据
 * @param {Object} options - { year, month, lockedIds }
 * @returns {{ monthPlan: Array, statistics: Object }}
 */
export function generateMonth(dishDB, options = {}) {
  const { lockedIds = new Set() } = options

  const meatPool = dishDB.filter(d => d.type === 'meat')
  const vegPool = dishDB.filter(d => d.type === 'vegetable')
  const usedIds = new Set(lockedIds)

  const monthPlan = []

  for (let week = 0; week < WEEKS_PER_MONTH; week++) {
    const coverage = assignWeeklyCoverage()
    const weekPlan = []

    for (let day = 0; day < WORKDAYS_PER_WEEK; day++) {
      const dayRequired = coverage.find(c => c.day === day).required

      // 尝试标准生成
      let dayMeat = selectMeatForDay({
        meatPool,
        usedIds,
        requiredIngredients: dayRequired,
        sichuanRatio: SICHUAN_TARGET_RATIO,
        lockedIds
      })

      // 如果荤菜不足4道，使用回退模式
      if (dayMeat.length < MEALS_PER_DAY.MEAT) {
        const retry = selectMeatRelaxed({
          meatPool,
          usedIds,
          requiredIngredients: dayRequired
        })
        if (retry.length > dayMeat.length) {
          dayMeat = retry
        }
      }

      const meatIngredients = dayMeat.map(d => d.mainIngredient)

      const dayVeg = selectVegForDay({
        vegPool,
        usedIds,
        meatIngredientsToday: meatIngredients,
        sichuanRatio: SICHUAN_TARGET_RATIO
      })

      weekPlan.push({
        meat: dayMeat,
        veg: dayVeg
      })
    }

    monthPlan.push(weekPlan)
  }

  // 校验结果
  const validation = validateMenu(monthPlan)

  // 计算统计信息
  const allDishes = monthPlan.flat().flatMap(d => [...d.meat, ...d.veg])
  const stats = {
    totalDishes: allDishes.length,
    totalMeat: allDishes.filter(d => d.type === 'meat').length,
    totalVeg: allDishes.filter(d => d.type === 'vegetable').length,
    sichuanRatio: allDishes.filter(d => d.cuisine === '川菜').length / allDishes.length,
    uniqueCount: new Set(allDishes.map(d => d.id)).size,
    avgSpiciness: (allDishes.reduce((s, d) => s + d.spiciness, 0) / allDishes.length).toFixed(1),
    violations: validation.violations
  }

  return { monthPlan, statistics: stats }
}
