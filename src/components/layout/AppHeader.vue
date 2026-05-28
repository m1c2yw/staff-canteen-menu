<template>
  <header class="app-header">
    <div class="header-left">
      <span class="header-icon">🍽️</span>
      <h1 class="header-title">职工食堂菜单</h1>
    </div>
    <div class="header-right">
      <el-tag type="info" size="large">
        {{ store.currentYear }}年{{ store.currentMonth }}月
      </el-tag>
    </div>
  </header>
</template>

<script setup>
import { useMenuStore } from '../../composables/useMenuStore.js'
const store = useMenuStore()
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0 16px;
  border-bottom: 2px solid var(--border-color);
  margin-bottom: 16px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-icon {
  font-size: 32px;
}
.header-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}
</style>
