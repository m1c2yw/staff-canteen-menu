<template>
  <div class="month-view fade-in" v-if="store.currentMonthPlan.length">
    <div class="weekday-header">
      <div class="weekday-cell label-col"></div>
      <div v-for="d in weekdays" :key="d" class="weekday-cell">
        {{ d }}
      </div>
    </div>

    <div
      v-for="(week, wi) in store.currentMonthPlan"
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
          :month-index="store.currentViewMonthIdx"
          :style="{ gridColumn: `span 1` }"
        />
        <!-- 不足5天的补空白 -->
        <div
          v-for="n in (5 - week.length)"
          :key="'empty-' + n"
          class="empty-day"
        />
      </div>
    </div>
  </div>
  <div v-else class="empty-state">
    <el-result icon="info" title="本月无工作日" />
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
  background: var(--bg-card); border-radius: 12px; overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.weekday-header {
  display: grid;
  grid-template-columns: 80px repeat(5, 1fr);
  background: #f0f2f5; border-bottom: 1px solid var(--border-color);
}
.weekday-cell {
  padding: 12px 8px; text-align: center; font-weight: 600;
  font-size: 14px; color: var(--text-secondary);
}
.week-row {
  display: grid;
  grid-template-columns: 80px repeat(5, 1fr);
  border-bottom: 1px solid var(--border-color);
}
.week-row:last-child { border-bottom: none; }
.week-label {
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 14px; color: var(--text-secondary);
  background: #fafbfc; border-right: 1px solid var(--border-color);
}
.week-days { display: contents; }
.empty-day {
  background: #fafbfc; border-right: 1px solid var(--border-color);
  min-height: 200px;
}
.empty-day:last-child { border-right: none; }
.empty-state { padding: 60px 0; }
</style>
