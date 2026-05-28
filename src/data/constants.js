// 菜系列表
export const CUISINES = ['川菜', '湘菜', '粤菜', '鲁菜', '苏菜', '闽菜', '浙菜', '徽菜', '东北菜', '西北菜', '家常菜']

// 每天荤菜必须覆盖的主料类别（每天至少出现一种）
export const MANDATORY_INGREDIENTS = ['鸡', '鸭', '鱼', '鹅', '牛肉', '海鲜']

// 荤菜主料类别
export const MEAT_INGREDIENTS = ['鸡', '鸭', '鱼', '鹅', '牛肉', '海鲜', '猪肉', '羊肉']

// 素菜主料类别
export const VEG_INGREDIENTS = ['蔬菜', '豆制品', '菌菇', '蛋类', '根茎']

// 烹饪方式
export const COOKING_METHODS = ['炒', '蒸', '煮', '烧', '烤', '炖', '炸', '拌', '卤', '焖', '煎', '熏']

// 每天菜品数量
export const MEALS_PER_DAY = { MEAT: 4, VEGETABLE: 3 }

// 工作日数
export const WORKDAYS_PER_WEEK = 5
export const WEEKS_PER_MONTH = 4

// 川菜目标比例
export const SICHUAN_TARGET_RATIO = 0.5

// 菜系颜色映射
export const CUISINE_COLORS = {
  '川菜': '#d35400',
  '湘菜': '#e67e22',
  '粤菜': '#2980b9',
  '鲁菜': '#8e44ad',
  '苏菜': '#16a085',
  '闽菜': '#2ecc71',
  '浙菜': '#1abc9c',
  '徽菜': '#7f8c8d',
  '东北菜': '#c0392b',
  '西北菜': '#d68910',
  '家常菜': '#27ae60'
}

// 主料图标映射
export const INGREDIENT_ICONS = {
  '鸡': '🐔',
  '鸭': '🦆',
  '鱼': '🐟',
  '鹅': '🦢',
  '牛肉': '🐂',
  '海鲜': '🦐',
  '猪肉': '🐖',
  '羊肉': '🐑',
  '蔬菜': '🥬',
  '豆制品': '🫘',
  '菌菇': '🍄',
  '蛋类': '🥚',
  '根茎': '🥔'
}
