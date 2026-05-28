<template>
  <div class="menu-toolbar">
    <div class="toolbar-left">
      <el-button-group>
        <el-button @click="store.navigateMonth(-1)" :icon="ArrowLeft" :disabled="store.currentViewMonthIdx === 0" />
        <el-button disabled class="month-label">
          {{ currentLabel }}
        </el-button>
        <el-button @click="store.navigateMonth(1)" :icon="ArrowRight" />
      </el-button-group>

      <el-divider direction="vertical" />

      <el-select v-model="store.numMonths" style="width: 130px;" size="default">
        <el-option :value="1" label="生成1个月" />
        <el-option :value="3" label="生成3个月" />
        <el-option :value="6" label="生成6个月" />
        <el-option :value="12" label="生成12个月" />
      </el-select>

      <el-button type="primary" @click="handleGenerate" :icon="Refresh">
        生成菜单
      </el-button>

      <el-button @click="handleExport" :icon="Camera" :disabled="!store.allPlans.length">
        导出图片
      </el-button>
    </div>

    <div class="toolbar-right">
      <span v-if="store.allPlans.length" class="month-indicator">
        {{ store.currentViewMonthIdx + 1 }} / {{ store.allPlans.length }} 月
      </span>

      <el-radio-group v-model="store.viewMode" size="default">
        <el-radio-button value="month">月视图</el-radio-button>
        <el-radio-button value="week">周视图</el-radio-button>
      </el-radio-group>

      <template v-if="store.viewMode === 'week' && store.currentMonthPlan.length">
        <el-divider direction="vertical" />
        <el-select v-model="store.currentWeek" style="width: 140px;">
          <el-option
            v-for="(_, idx) in store.currentMonthPlan"
            :key="idx"
            :label="`第${idx + 1}周`"
            :value="idx"
          />
        </el-select>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowLeft, ArrowRight, Refresh, Camera } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useMenuStore } from '../../composables/useMenuStore.js'
import { exportAsImage } from '../../composables/useMenuExport.js'

const store = useMenuStore()

const currentLabel = computed(() => {
  const m = store.allPlans[store.currentViewMonthIdx]
  if (m) return `${m.year}年${m.month}月`
  return `${store.currentYear}年${store.currentMonth}月`
})

function handleGenerate() {
  if (store.allPlans.length > 0) {
    ElMessageBox.confirm(
      '重新生成将清除所有已有菜单，是否继续？',
      '确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    ).then(() => store.generate()).catch(() => {})
  } else {
    store.generate()
  }
}

function handleExport() {
  const m = store.allPlans[store.currentViewMonthIdx]
  const filename = `食堂菜单_${m?.year || store.currentYear}年${m?.month || store.currentMonth}月`
  exportAsImage('export-area', filename)
}
</script>

<style scoped>
.menu-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; flex-wrap: wrap; gap: 12px;
}
.toolbar-left, .toolbar-right {
  display: flex; align-items: center; gap: 8px;
}
.month-label { min-width: 110px; font-weight: 600; }
.month-indicator {
  font-size: 13px; color: var(--text-secondary);
  background: #f0f2f5; padding: 4px 10px; border-radius: 4px;
}
</style>
