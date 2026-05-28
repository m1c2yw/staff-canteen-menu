// 菜品加权评分 — 用于在候选池中智能选择菜品
import { SICHUAN_TARGET_RATIO } from '../data/constants.js'

/**
 * 计算菜品在当前上下文中的得分
 * @param {Object} dish - 菜品对象
 * @param {Object} context - 上下文 { sichuanCount, sichuanTarget, usedIngredientsToday, selectedSoFar, dayIndex }
 * @returns {number} 得分（越高越优先选择）
 */
export function scoreDish(dish, context = {}) {
  let score = 1.0
  const { sichuanCount = 0, sichuanTarget = 0, usedIngredientsToday = new Set(), selectedSoFar = [] } = context

  // 1. 川菜比例平衡
  const sichuanGap = sichuanTarget - sichuanCount
  if (dish.cuisine === '川菜' && sichuanGap > 0) {
    score *= 1.0 + sichuanGap * 0.8  // 需要川菜时加分
  }
  if (dish.cuisine === '川菜' && sichuanGap <= -1) {
    score *= 0.3  // 川菜已超标，降权
  }
  if (dish.cuisine !== '川菜' && sichuanGap <= -2) {
    score *= 1.8  // 川菜严重超标时，非川菜加分
  }

  // 2. 当天主料不重复
  if (usedIngredientsToday.has(dish.mainIngredient)) {
    score *= 0.05  // 近乎禁止同一天出现相同主料
  }

  // 3. 烹饪方式多样化
  const methodsUsed = new Set(selectedSoFar.map(d => d.cookingMethod))
  if (methodsUsed.has(dish.cookingMethod)) {
    score *= 0.7  // 同烹饪方式降权（适度）
  }

  // 4. 辣度均衡（目标日均 2.5-3.0）
  if (selectedSoFar.length > 0) {
    const avgSpiciness = selectedSoFar.reduce((s, d) => s + d.spiciness, 0) / selectedSoFar.length
    const deviation = Math.abs(dish.spiciness - avgSpiciness)
    score *= 1.0 / (1.0 + deviation * 0.15)
  }

  // 5. 菜系多样性加分
  const cuisinesUsed = new Set(selectedSoFar.map(d => d.cuisine))
  if (!cuisinesUsed.has(dish.cuisine) && dish.cuisine !== '川菜') {
    score *= 1.3  // 引入新菜系加分
  }

  // 6. 经典菜品轻微加分（优先选择大家熟悉的）
  if (dish.tags?.includes('经典') && selectedSoFar.length <= 2) {
    score *= 1.15
  }

  // 7. 标签多样性：凉菜不宜过多
  const coldCount = selectedSoFar.filter(d => d.tags?.includes('凉菜')).length
  if (dish.tags?.includes('凉菜') && coldCount >= 1) {
    score *= 0.3  // 每天最多1-2个凉菜
  }

  // 8. 汤类不宜过多
  const soupCount = selectedSoFar.filter(d => d.tags?.includes('汤')).length
  if (dish.tags?.includes('汤') && soupCount >= 1) {
    score *= 0.3
  }

  // 确保分数不为负
  return Math.max(score, 0.01)
}

/**
 * 带权重的随机选择
 * @param {Array} candidates - 候选菜品数组
 * @param {Object} context - 评分上下文
 * @returns {Object} 选中的菜品
 */
export function weightedPick(candidates, context = {}) {
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  const scored = candidates.map(dish => ({
    dish,
    weight: scoreDish(dish, context)
  }))

  const totalWeight = scored.reduce((sum, s) => sum + s.weight, 0)
  if (totalWeight <= 0) {
    // 所有权重为零，随机选一个
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  let r = Math.random() * totalWeight
  for (const s of scored) {
    r -= s.weight
    if (r <= 0) return s.dish
  }
  return scored[scored.length - 1].dish
}
