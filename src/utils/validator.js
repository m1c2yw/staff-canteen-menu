// 菜单约束校验器
import { MANDATORY_INGREDIENTS, MEALS_PER_DAY, WORKDAYS_PER_WEEK } from '../data/constants.js'

/**
 * 校验整月菜单是否符合所有约束
 * @param {Array} monthPlan - monthPlan[week][day] = { date, meat: [], veg: [] }
 * @returns {{ valid: boolean, violations: string[] }}
 */
export function validateMenu(monthPlan) {
  const violations = []

  // 1. 检查是否有菜品重复
  const allIds = new Set()
  const duplicateNames = []
  monthPlan.flat().forEach((day, i) => {
    const weekIdx = Math.floor(i / 5)
    const dayIdx = i % 5
    ;[...day.meat, ...day.veg].forEach(dish => {
      if (allIds.has(dish.id)) {
        duplicateNames.push(`${dish.name}（第${weekIdx + 1}周周${'一二三四五'[dayIdx]}）`)
      }
      allIds.add(dish.id)
    })
  })
  if (duplicateNames.length > 0) {
    violations.push(`菜品重复: ${duplicateNames.join('、')}`)
  }

  // 2. 检查每天菜品数量
  monthPlan.flat().forEach((day, i) => {
    const label = `第${Math.floor(i / 5) + 1}周周${'一二三四五'[i % 5]}`
    if (day.meat.length !== MEALS_PER_DAY.MEAT) {
      violations.push(`${label}: 荤菜 ${day.meat.length} 道（应为 ${MEALS_PER_DAY.MEAT}）`)
    }
    if (day.veg.length !== MEALS_PER_DAY.VEGETABLE) {
      violations.push(`${label}: 素菜 ${day.veg.length} 道（应为 ${MEALS_PER_DAY.VEGETABLE}）`)
    }
  })

  // 3. 检查每天至少有一种必须食材（鸡、鸭、鱼、鹅、牛肉、海鲜）
  monthPlan.flat().forEach((day, i) => {
    const dayIngredients = new Set(day.meat.map(d => d.mainIngredient))
    const hasMandatory = MANDATORY_INGREDIENTS.some(ing => dayIngredients.has(ing))
    if (!hasMandatory) {
      const label = `第${Math.floor(i / 5) + 1}周周${'一二三四五'[i % 5]}`
      violations.push(`${label}: 荤菜缺少必须食材类别（鸡/鸭/鱼/鹅/牛肉/海鲜至少一种）`)
    }
  })

  // 4. 检查每周必须覆盖所有6类食材
  for (let w = 0; w < monthPlan.length; w++) {
    const weekIngredients = new Set()
    monthPlan[w].forEach(day => {
      day.meat.forEach(d => weekIngredients.add(d.mainIngredient))
    })
    const missing = MANDATORY_INGREDIENTS.filter(ing => !weekIngredients.has(ing))
    if (missing.length > 0) {
      violations.push(`第${w + 1}周: 缺少 ${missing.join('、')} 类菜品`)
    }
  }

  return {
    valid: violations.length === 0,
    violations
  }
}
