// 菜品加权评分 v2 — 支持主题驱动的动态评分
export function scoreDish(dish, context = {}) {
  let score = 1.0
  const {
    sichuanCount = 0, sichuanTarget = 2,
    usedIngredientsToday = new Set(),
    selectedSoFar = [],
    theme = null
  } = context

  // 1. 主题偏好
  if (theme) {
    // 菜系偏好
    if (theme.cuisinePref?.length > 0) {
      if (theme.cuisinePref.includes(dish.cuisine)) {
        score *= 2.0
      } else if (theme.name !== '普通日') {
        score *= 0.5
      }
    }
    // 烹饪方式偏好
    if (theme.methodPref?.length > 0 && theme.name !== '普通日') {
      if (theme.methodPref.includes(dish.cookingMethod)) {
        score *= 1.5
      }
    }
    // 食材偏好
    if (theme.ingredientPref?.length > 0) {
      if (theme.ingredientPref.includes(dish.mainIngredient)) {
        score *= 2.5
      }
    }
  }

  // 2. 川菜比例平衡（灵活目标）
  const sichuanGap = sichuanTarget - sichuanCount
  if (dish.cuisine === '川菜' && sichuanGap > 0) {
    score *= 1.0 + sichuanGap * 0.6
  }
  if (dish.cuisine === '川菜' && sichuanGap <= -2) {
    score *= 0.3
  }

  // 3. 当天主料重复（放松：允许偶尔重复）
  if (usedIngredientsToday.has(dish.mainIngredient)) {
    score *= 0.2  // 从0.05放松到0.2，允许偶尔同主料
  }

  // 4. 烹饪方式多样化（轻度）
  const methodsUsed = new Set(selectedSoFar.map(d => d.cookingMethod))
  if (methodsUsed.has(dish.cookingMethod) && methodsUsed.size <= 3) {
    score *= 0.75
  }

  // 5. 辣度波动（跟随主题，不强制均衡）
  if (theme?.spiceShift && selectedSoFar.length > 0) {
    const avgSpiciness = selectedSoFar.reduce((s, d) => s + d.spiciness, 0) / selectedSoFar.length
    const targetSpiciness = Math.max(1, Math.min(5, avgSpiciness + theme.spiceShift))
    const deviation = Math.abs(dish.spiciness - targetSpiciness)
    score *= 1.0 / (1.0 + deviation * 0.2)
  } else if (selectedSoFar.length > 2) {
    // 无主题时轻度均衡
    const avgSpiciness = selectedSoFar.reduce((s, d) => s + d.spiciness, 0) / selectedSoFar.length
    const deviation = Math.abs(dish.spiciness - avgSpiciness)
    score *= 1.0 / (1.0 + deviation * 0.1)
  }

  // 6. 菜系多样性（保留但降低权重）
  const cuisinesUsed = new Set(selectedSoFar.map(d => d.cuisine))
  if (!cuisinesUsed.has(dish.cuisine) && dish.cuisine !== '川菜' && selectedSoFar.length >= 3) {
    score *= 1.2
  }

  // 7. 经典菜品偏好
  if (dish.tags?.includes('经典') && selectedSoFar.length <= 2) {
    score *= 1.1
  }

  // 8. 凉菜/汤类数量控制
  const coldCount = selectedSoFar.filter(d => d.tags?.includes('凉菜')).length
  if (dish.tags?.includes('凉菜') && coldCount >= 2) score *= 0.3
  const soupCount = selectedSoFar.filter(d => d.tags?.includes('汤')).length
  if (dish.tags?.includes('汤') && soupCount >= 1) score *= 0.3

  return Math.max(score, 0.01)
}

// 带权重的随机选择
export function weightedPick(candidates, context = {}) {
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  const scored = candidates.map(dish => ({
    dish,
    weight: scoreDish(dish, context)
  }))

  const totalWeight = scored.reduce((sum, s) => sum + s.weight, 0)
  if (totalWeight <= 0) {
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  let r = Math.random() * totalWeight
  for (const s of scored) {
    r -= s.weight
    if (r <= 0) return s.dish
  }
  return scored[scored.length - 1].dish
}
