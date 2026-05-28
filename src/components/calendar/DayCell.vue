<template>
  <div class="day-cell" :class="{ 'has-issue': hasIssue }">
    <div class="day-header">
      <span class="day-date">{{ day.date }}</span>
      <span class="day-weekday">{{ day.weekday }}</span>
      <!-- 主题标签 -->
      <el-tag v-if="day.theme" size="small" :type="themeType" effect="plain" class="theme-tag">
        {{ day.theme }}
      </el-tag>

      <!-- 必须食材标签 -->
      <div class="mandatory-tags">
        <el-tag
          v-for="ing in dayMandatoryIngredients"
          :key="ing"
          size="small"
          type="danger"
          effect="plain"
        >
          {{ ing }}
        </el-tag>
      </div>
    </div>

    <!-- 荤菜区 -->
    <div class="dish-section meat-section">
      <div class="section-label">🥩 荤菜</div>
      <div
        v-for="(dish, i) in day.meat"
        :key="dish.id"
        class="dish-item meat-item"
        @click="openPicker('meat', i, dish)"
      >
        <DishCard :dish="dish" compact />
      </div>
      <!-- 占位：不足4道时显示 -->
      <div v-if="day.meat.length < 4" class="dish-item empty-slot">
        <span class="empty-text">— 待补充 —</span>
      </div>
    </div>

    <!-- 素菜区 -->
    <div class="dish-section veg-section">
      <div class="section-label">🥬 素菜</div>
      <div
        v-for="(dish, i) in day.veg"
        :key="dish.id"
        class="dish-item veg-item"
        @click="openPicker('veg', i, dish)"
      >
        <DishCard :dish="dish" compact />
      </div>
      <div v-if="day.veg.length < 3" class="dish-item empty-slot">
        <span class="empty-text">— 待补充 —</span>
      </div>
    </div>

    <!-- 替换弹窗 -->
    <DishPickerDialog
      v-model:visible="pickerVisible"
      :current-dish="currentDish"
      :slot-type="slotType"
      @confirm="handleReplace"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMenuStore } from '../../composables/useMenuStore.js'
import { MANDATORY_INGREDIENTS } from '../../data/constants.js'
import DishCard from '../dish/DishCard.vue'
import DishPickerDialog from '../dish/DishPickerDialog.vue'

const props = defineProps({
  day: { type: Object, required: true },
  weekIndex: { type: Number, required: true },
  dayIndex: { type: Number, required: true },
  monthIndex: { type: Number, default: 0 }
})

const store = useMenuStore()

const pickerVisible = ref(false)
const currentDish = ref(null)
const slotType = ref('meat')
const slotIdx = ref(0)

const dayMandatoryIngredients = computed(() => {
  const ingredients = props.day.meat.map(d => d.mainIngredient)
  return [...new Set(ingredients)].filter(ing => MANDATORY_INGREDIENTS.includes(ing))
})

const hasIssue = computed(() => {
  return props.day.meat.length < 4 || props.day.veg.length < 3
})

const themeType = computed(() => {
  const map = { '川味日': 'danger', '清淡日': 'success', '海鲜日': 'primary', '硬菜日': 'warning', '普通日': 'info' }
  return map[props.day.theme] || 'info'
})

function openPicker(type, idx, dish) {
  slotType.value = type
  slotIdx.value = idx
  currentDish.value = dish
  pickerVisible.value = true
}

function handleReplace(newDish) {
  store.replaceDish(props.monthIndex, props.weekIndex, props.dayIndex, slotType.value, slotIdx.value, newDish)
}
</script>

<style scoped>
.day-cell {
  border-right: 1px solid var(--border-color);
  padding: 10px;
  min-height: 280px;
}
.day-cell:last-child {
  border-right: none;
}
.day-cell.has-issue {
  background: #fef0f0;
}
.day-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.day-date {
  font-weight: 700;
  font-size: 14px;
  color: var(--text-primary);
}
.day-weekday {
  font-size: 12px;
  color: var(--text-secondary);
}
.mandatory-tags {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
}
.dish-section {
  margin-bottom: 6px;
}
.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 3px;
  padding-bottom: 2px;
  border-bottom: 1px dashed var(--border-color);
}
.dish-item {
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s;
  padding: 1px 2px;
  margin-bottom: 1px;
}
.dish-item:hover {
  background: #ecf5ff;
}
.meat-item:hover {
  background: #fef0f0;
}
.veg-item:hover {
  background: #f0f9eb;
}
.empty-slot {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background: #fafafa;
  border: 1px dashed #ddd;
  border-radius: 4px;
}
.empty-text {
  font-size: 12px;
  color: #c0c4cc;
}
</style>
