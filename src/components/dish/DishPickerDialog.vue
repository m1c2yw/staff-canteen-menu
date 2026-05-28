<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="替换菜品"
    width="680px"
    destroy-on-close
  >
    <div v-if="currentDish" class="picker-body">
      <!-- 当前菜品信息 -->
      <div class="current-dish-info">
        <span class="label">当前菜品：</span>
        <el-tag type="info" size="large">{{ currentDish.name }}</el-tag>
        <el-tag size="small">{{ currentDish.cuisine }}</el-tag>
        <span>{{ '🌶'.repeat(currentDish.spiciness) }}</span>
      </div>

      <!-- 筛选条件 -->
      <div class="filter-bar">
        <el-select v-model="filterCuisine" placeholder="菜系" clearable size="small" style="width: 110px;">
          <el-option v-for="c in cuisines" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="filterIngredient" placeholder="主料" clearable size="small" style="width: 110px;">
          <el-option v-for="ing in ingredients" :key="ing" :label="ing" :value="ing" />
        </el-select>
        <el-select v-model="filterSpiciness" placeholder="辣度" clearable size="small" style="width: 100px;">
          <el-option v-for="s in [1,2,3,4,5]" :key="s" :label="'🌶'.repeat(s) || '☆'" :value="s" />
        </el-select>
        <el-input
          v-model="searchText"
          placeholder="搜索菜名"
          clearable
          size="small"
          style="width: 160px;"
        />
      </div>

      <!-- 候选列表 -->
      <div class="candidate-grid">
        <div
          v-for="dish in filteredCandidates"
          :key="dish.id"
          class="candidate-item"
          :class="{ selected: selectedId === dish.id }"
          @click="selectedId = dish.id"
        >
          <div class="candidate-top">
            <span class="candidate-icon">{{ getIcon(dish) }}</span>
            <span class="candidate-name">{{ dish.name }}</span>
          </div>
          <div class="candidate-meta">
            <el-tag :color="getColor(dish)" effect="dark" size="small">{{ dish.cuisine }}</el-tag>
            <span class="candidate-spice">{{ '🌶'.repeat(dish.spiciness) || '☆' }}</span>
            <span class="candidate-method">{{ dish.cookingMethod }}</span>
          </div>
        </div>

        <div v-if="filteredCandidates.length === 0" class="no-result">
          没有符合条件的菜品
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :disabled="!selectedId" @click="confirmReplace">
        确认替换
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useMenuStore } from '../../composables/useMenuStore.js'
import { CUISINE_COLORS, INGREDIENT_ICONS, MEAT_INGREDIENTS, VEG_INGREDIENTS } from '../../data/constants.js'
import dishesData from '../../data/dishes.json'

const props = defineProps({
  visible: { type: Boolean, default: false },
  currentDish: { type: Object, default: null },
  slotType: { type: String, default: 'meat' }
})

const emit = defineEmits(['update:visible', 'confirm'])

const store = useMenuStore()

const filterCuisine = ref('')
const filterIngredient = ref('')
const filterSpiciness = ref(null)
const searchText = ref('')
const selectedId = ref(null)

const cuisines = ['川菜', '湘菜', '粤菜', '鲁菜', '苏菜', '闽菜', '浙菜', '徽菜', '东北菜', '西北菜', '家常菜']
const ingredients = computed(() => props.slotType === 'meat' ? MEAT_INGREDIENTS : VEG_INGREDIENTS)

// 获取本月已使用的菜品ID
const usedIds = computed(() => {
  const ids = new Set()
  store.monthPlan.flat().forEach(day => {
    ;[...day.meat, ...day.veg].forEach(d => ids.add(d.id))
  })
  // 移除当前被替换的菜品ID（允许改回）
  if (props.currentDish) {
    ids.delete(props.currentDish.id)
  }
  return ids
})

// 候选菜品
const filteredCandidates = computed(() => {
  let candidates = dishesData.filter(d => {
    if (d.type !== props.slotType) return false
    if (usedIds.value.has(d.id)) return false
    if (filterCuisine.value && d.cuisine !== filterCuisine.value) return false
    if (filterIngredient.value && d.mainIngredient !== filterIngredient.value) return false
    if (filterSpiciness.value && d.spiciness !== filterSpiciness.value) return false
    if (searchText.value && !d.name.includes(searchText.value)) return false
    return true
  })

  // 排序：同主料优先
  if (props.currentDish) {
    const curIng = props.currentDish.mainIngredient
    candidates.sort((a, b) => {
      if (a.mainIngredient === curIng && b.mainIngredient !== curIng) return -1
      if (a.mainIngredient !== curIng && b.mainIngredient === curIng) return 1
      return 0
    })
  }

  return candidates
})

// 当对话框打开时重置
watch(() => props.visible, (val) => {
  if (val) {
    filterCuisine.value = ''
    filterIngredient.value = ''
    filterSpiciness.value = null
    searchText.value = ''
    selectedId.value = null
  }
})

function getIcon(dish) {
  return INGREDIENT_ICONS[dish.mainIngredient] || '🍽️'
}

function getColor(dish) {
  return CUISINE_COLORS[dish.cuisine] || '#7f8c8d'
}

function confirmReplace() {
  const newDish = dishesData.find(d => d.id === selectedId.value)
  if (newDish) {
    emit('confirm', newDish)
  }
  emit('update:visible', false)
}
</script>

<style scoped>
.picker-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.current-dish-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
}
.current-dish-info .label {
  color: var(--text-secondary);
}
.filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.candidate-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
}
.candidate-item {
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.candidate-item:hover {
  border-color: #409eff;
}
.candidate-item.selected {
  border-color: #409eff;
  background: #ecf5ff;
}
.candidate-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.candidate-icon {
  font-size: 18px;
}
.candidate-name {
  font-weight: 600;
  font-size: 14px;
}
.candidate-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}
.candidate-spice {
  font-size: 12px;
}
.candidate-method {
  font-size: 11px;
  color: var(--text-secondary);
  background: #f4f4f5;
  padding: 0 4px;
  border-radius: 2px;
}
.no-result {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}
</style>
