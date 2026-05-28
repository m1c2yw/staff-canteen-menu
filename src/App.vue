<template>
  <div id="app-root">
    <AppHeader />
    <MenuToolbar />
    <MenuStatsPanel v-if="store.statistics" />
    <div id="export-area">
      <div v-if="!store.monthPlan.length" class="empty-state">
        <el-result icon="info" title="还没有生成菜单" sub-title="点击「自动生成」按钮来生成月度菜单">
          <template #extra>
            <el-button type="primary" size="large" @click="handleGenerate">🎲 自动生成菜单</el-button>
          </template>
        </el-result>
      </div>
      <MonthView v-else-if="store.viewMode === 'month'" />
      <WeekView v-else />
    </div>
  </div>
</template>

<script setup>
import { useMenuStore } from './composables/useMenuStore.js'
import AppHeader from './components/layout/AppHeader.vue'
import MenuToolbar from './components/controls/MenuToolbar.vue'
import MenuStatsPanel from './components/stats/MenuStatsPanel.vue'
import MonthView from './components/calendar/MonthView.vue'
import WeekView from './components/calendar/WeekView.vue'

const store = useMenuStore()

function handleGenerate() {
  store.generate()
}
</script>

<style scoped>
#app-root {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px 40px;
}
.empty-state {
  margin-top: 80px;
}
</style>
