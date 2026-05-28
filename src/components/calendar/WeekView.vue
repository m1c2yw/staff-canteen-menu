<template>
  <div class="week-view fade-in" v-if="currentWeekData">
    <h3 class="week-title">
      第{{ store.currentWeek + 1 }}周
      <span class="week-date-range">{{ dateRange }}</span>
    </h3>

    <el-table :data="currentWeekData" border stripe style="width: 100%;">
      <el-table-column label="" width="100" fixed>
        <template #default="{ row }">
          <div class="day-label">
            <div class="day-date">{{ row.date }}</div>
            <div class="day-wd">{{ row.weekday }}</div>
            <el-tag v-if="row.theme" size="small" :type="getThemeType(row.theme)">{{ row.theme }}</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="荤菜 1" width="150">
        <template #default="{ row }"><DishCard v-if="row.meat[0]" :dish="row.meat[0]" /></template>
      </el-table-column>
      <el-table-column label="荤菜 2" width="150">
        <template #default="{ row }"><DishCard v-if="row.meat[1]" :dish="row.meat[1]" /></template>
      </el-table-column>
      <el-table-column label="荤菜 3" width="150">
        <template #default="{ row }"><DishCard v-if="row.meat[2]" :dish="row.meat[2]" /></template>
      </el-table-column>
      <el-table-column label="荤菜 4" width="150">
        <template #default="{ row }"><DishCard v-if="row.meat[3]" :dish="row.meat[3]" /></template>
      </el-table-column>
      <el-table-column label="素菜 1" width="150">
        <template #default="{ row }"><DishCard v-if="row.veg[0]" :dish="row.veg[0]" /></template>
      </el-table-column>
      <el-table-column label="素菜 2" width="150">
        <template #default="{ row }"><DishCard v-if="row.veg[1]" :dish="row.veg[1]" /></template>
      </el-table-column>
      <el-table-column label="素菜 3" width="150">
        <template #default="{ row }"><DishCard v-if="row.veg[2]" :dish="row.veg[2]" /></template>
      </el-table-column>
    </el-table>

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
import DishCard from '../dish/DishCard.vue'
import DishPickerDialog from '../dish/DishPickerDialog.vue'

const store = useMenuStore()

const pickerVisible = ref(false)
const currentDish = ref(null)
const slotType = ref('meat')
const editMonthIdx = ref(0), editWeekIdx = ref(0), editDayIdx = ref(0), editSlotIdx = ref(0)

const currentWeekData = computed(() => {
  const week = store.currentMonthPlan[store.currentWeek]
  if (!week) return null
  return week.map((day, di) => ({ ...day }))
})

const dateRange = computed(() => {
  if (!currentWeekData.value) return ''
  const dates = currentWeekData.value.map(d => d.date).filter(Boolean)
  if (dates.length === 0) return ''
  return `${dates[0]} — ${dates[dates.length - 1]}`
})

function getThemeType(theme) {
  const map = { '川味日': 'danger', '清淡日': 'success', '海鲜日': 'primary', '硬菜日': 'warning' }
  return map[theme] || 'info'
}

function openPicker(type, idx, dish) { /* 占位，保留功能 */ }
function handleReplace(newDish) {
  store.replaceDish(editMonthIdx.value, editWeekIdx.value, editDayIdx.value, slotType.value, editSlotIdx.value, newDish)
}
</script>

<style scoped>
.week-view {
  background: var(--bg-card); border-radius: 12px; padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.week-title { margin-bottom: 16px; font-size: 18px; }
.week-date-range { font-size: 14px; font-weight: 400; color: var(--text-secondary); margin-left: 12px; }
.day-label { text-align: center; }
.day-date { font-weight: 700; font-size: 14px; }
.day-wd { font-size: 12px; color: var(--text-secondary); }
</style>
