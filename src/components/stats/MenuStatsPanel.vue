<template>
  <div class="stats-panel fade-in">
    <el-card shadow="never">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">荤菜</span>
          <span class="stat-value meat">{{ store.statistics.totalMeat }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">素菜</span>
          <span class="stat-value veg">{{ store.statistics.totalVeg }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">不重复菜品</span>
          <span class="stat-value">{{ store.statistics.uniqueCount }}/140</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">川菜占比</span>
          <span class="stat-value" :class="{ warn: store.statistics.sichuanRatio < 0.4 || store.statistics.sichuanRatio > 0.6 }">
            {{ (store.statistics.sichuanRatio * 100).toFixed(0) }}%
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均辣度</span>
          <span class="stat-value">{{ store.statistics.avgSpiciness }}</span>
        </div>
      </div>

      <!-- 违规提示 -->
      <div v-if="store.statistics.violations?.length" class="violations">
        <el-alert
          v-for="(v, i) in store.statistics.violations"
          :key="i"
          :title="v"
          type="warning"
          show-icon
          :closable="false"
          style="margin-top: 4px;"
        />
      </div>
      <div v-else class="all-good">
        <el-tag type="success" size="large">✅ 全部约束满足</el-tag>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { useMenuStore } from '../../composables/useMenuStore.js'
const store = useMenuStore()
</script>

<style scoped>
.stats-panel {
  margin-bottom: 16px;
}
.stats-grid {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}
.stat-value {
  font-size: 20px;
  font-weight: 700;
}
.stat-value.meat { color: var(--color-meat); }
.stat-value.veg { color: var(--color-veg); }
.stat-value.warn { color: #e6a23c; }
.violations { margin-top: 12px; }
.all-good { margin-top: 8px; }
</style>
