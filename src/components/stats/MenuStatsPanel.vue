<template>
  <div class="stats-panel fade-in" v-if="stats">
    <el-card shadow="never">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">工作日</span>
          <span class="stat-value">{{ stats.totalDishes ? stats.totalDishes / 7 : 0 }}天</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">荤菜</span>
          <span class="stat-value meat">{{ stats.totalMeat }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">素菜</span>
          <span class="stat-value veg">{{ stats.totalVeg }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">不重复</span>
          <span class="stat-value">{{ stats.uniqueCount }}/{{ stats.totalDishes }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">川菜占比</span>
          <span class="stat-value" :class="{ warn: sichuanWarn }">
            {{ (stats.sichuanRatio * 100).toFixed(0) }}%
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均辣度</span>
          <span class="stat-value">{{ stats.avgSpiciness }}</span>
        </div>
      </div>

      <div v-if="stats.withinMonthDupes?.length" class="violations">
        <el-alert title="本月内有重复菜品" type="error" show-icon :closable="false" />
      </div>
      <div v-else-if="stats.totalDishes > 0" class="all-good">
        <el-tag type="success" size="large">✅ 本月无重复</el-tag>
      </div>

      <div v-if="store.allPlans.length > 1" class="multi-month-info">
        <el-divider />
        <span class="text-secondary">
          已生成 {{ store.allPlans.length }} 个月菜单，冷却期3个月
        </span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMenuStore } from '../../composables/useMenuStore.js'
const store = useMenuStore()

const stats = computed(() => store.currentStats)

const sichuanWarn = computed(() => {
  if (!stats.value) return false
  const r = stats.value.sichuanRatio
  return r < 0.35 || r > 0.65
})
</script>

<style scoped>
.stats-panel { margin-bottom: 16px; }
.stats-grid { display: flex; gap: 24px; flex-wrap: wrap; }
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-label { font-size: 12px; color: var(--text-secondary); }
.stat-value { font-size: 20px; font-weight: 700; }
.stat-value.meat { color: var(--color-meat); }
.stat-value.veg { color: var(--color-veg); }
.stat-value.warn { color: #e6a23c; }
.violations, .all-good { margin-top: 8px; }
.multi-month-info { margin-top: 4px; }
.text-secondary { font-size: 13px; color: var(--text-secondary); }
</style>
