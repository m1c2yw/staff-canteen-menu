<template>
  <div class="month-view fade-in">
    <!-- 表头：星期 -->
    <div class="weekday-header">
      <div v-for="d in weekdays" :key="d" class="weekday-cell">
        {{ d }}
      </div>
    </div>

    <!-- 四周 × 五天 网格 -->
    <div
      v-for="(week, wi) in store.monthPlan"
      :key="wi"
      class="week-row"
    >
      <div class="week-label">第{{ wi + 1 }}周</div>
      <div class="week-days">
        <DayCell
          v-for="(day, di) in week"
          :key="di"
          :day="day"
          :week-index="wi"
          :day-index="di"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMenuStore } from '../../composables/useMenuStore.js'
import DayCell from './DayCell.vue'

const store = useMenuStore()
const weekdays = ['星期一', '星期二', '星期三', '星期四', '星期五']
</script>

<style scoped>
.month-view {
  background: var(--bg-card);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.weekday-header {
  display: grid;
  grid-template-columns: 80px repeat(5, 1fr);
  background: #f0f2f5;
  border-bottom: 1px solid var(--border-color);
}
.weekday-cell {
  padding: 12px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-secondary);
}
.weekday-cell:first-child {
  /* 留空给周标签列 */
}
.week-row {
  display: grid;
  grid-template-columns: 80px repeat(5, 1fr);
  border-bottom: 1px solid var(--border-color);
}
.week-row:last-child {
  border-bottom: none;
}
.week-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-secondary);
  background: #fafbfc;
  border-right: 1px solid var(--border-color);
  writing-mode: horizontal-tb;
}
.week-days {
  display: contents;
}
</style>
