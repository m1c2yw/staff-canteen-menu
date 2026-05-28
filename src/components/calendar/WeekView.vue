<template>
  <div class="week-view fade-in" v-if="currentWeekData">
    <h3 class="week-title">
      第{{ store.currentWeek + 1 }}周
      <span class="week-date-range">{{ dateRange }}</span>
    </h3>

    <div class="week-table">
      <el-table :data="currentWeekData" border stripe style="width: 100%;">
        <el-table-column prop="label" label="" width="100" fixed>
          <template #default="{ row }">
            <div class="day-label">
              <div class="day-date">{{ row.date }}</div>
              <div class="day-wd">{{ row.weekday }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="荤菜 1" width="150">
          <template #default="{ row }">
            <DishCard v-if="row.meat[0]" :dish="row.meat[0]" @click="openPicker(row._wi, row._di, 'meat', 0, row.meat[0])" />
          </template>
        </el-table-column>
        <el-table-column label="荤菜 2" width="150">
          <template #default="{ row }">
            <DishCard v-if="row.meat[1]" :dish="row.meat[1]" @click="openPicker(row._wi, row._di, 'meat', 1, row.meat[1])" />
          </template>
        </el-table-column>
        <el-table-column label="荤菜 3" width="150">
          <template #default="{ row }">
            <DishCard v-if="row.meat[2]" :dish="row.meat[2]" @click="openPicker(row._wi, row._di, 'meat', 2, row.meat[2])" />
          </template>
        </el-table-column>
        <el-table-column label="荤菜 4" width="150">
          <template #default="{ row }">
            <DishCard v-if="row.meat[3]" :dish="row.meat[3]" @click="openPicker(row._wi, row._di, 'meat', 3, row.meat[3])" />
          </template>
        </el-table-column>
        <el-table-column label="素菜 1" width="150">
          <template #default="{ row }">
            <DishCard v-if="row.veg[0]" :dish="row.veg[0]" @click="openPicker(row._wi, row._di, 'veg', 0, row.veg[0])" />
          </template>
        </el-table-column>
        <el-table-column label="素菜 2" width="150">
          <template #default="{ row }">
            <DishCard v-if="row.veg[1]" :dish="row.veg[1]" @click="openPicker(row._wi, row._di, 'veg', 1, row.veg[1])" />
          </template>
        </el-table-column>
        <el-table-column label="素菜 3" width="150">
          <template #default="{ row }">
            <DishCard v-if="row.veg[2]" :dish="row.veg[2]" @click="openPicker(row._wi, row._di, 'veg', 2, row.veg[2])" />
          </template>
        </el-table-column>
      </el-table>
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
import DishCard from '../dish/DishCard.vue'
import DishPickerDialog from '../dish/DishPickerDialog.vue'

const store = useMenuStore()

const pickerVisible = ref(false)
const currentDish = ref(null)
const slotType = ref('meat')
const editWeekIdx = ref(0)
const editDayIdx = ref(0)
const editSlotIdx = ref(0)

const currentWeekData = computed(() => {
  const week = store.monthPlan[store.currentWeek]
  if (!week) return null
  return week.map((day, di) => ({
    ...day,
    _wi: store.currentWeek,
    _di: di
  }))
})

const dateRange = computed(() => {
  if (!currentWeekData.value) return ''
  const dates = currentWeekData.value.map(d => d.date).filter(Boolean)
  if (dates.length === 0) return ''
  return `${dates[0]} — ${dates[dates.length - 1]}`
})

function openPicker(wi, di, type, si, dish) {
  editWeekIdx.value = wi
  editDayIdx.value = di
  editSlotIdx.value = si
  slotType.value = type
  currentDish.value = dish
  pickerVisible.value = true
}

function handleReplace(newDish) {
  store.replaceDish(editWeekIdx.value, editDayIdx.value, slotType.value, editSlotIdx.value, newDish)
}
</script>

<style scoped>
.week-view {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.week-title {
  margin-bottom: 16px;
  font-size: 18px;
}
.week-date-range {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 12px;
}
.week-table {
  overflow-x: auto;
}
.day-label {
  text-align: center;
}
.day-date {
  font-weight: 700;
  font-size: 14px;
}
.day-wd {
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
