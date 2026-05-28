<template>
  <div class="menu-toolbar">
    <div class="toolbar-left">
      <el-button-group>
        <el-button @click="store.navigateMonth(-1)" :icon="ArrowLeft" />
        <el-button disabled class="month-label">
          {{ store.currentYear }}年{{ store.currentMonth }}月
        </el-button>
        <el-button @click="store.navigateMonth(1)" :icon="ArrowRight" />
      </el-button-group>

      <el-divider direction="vertical" />

      <el-button type="primary" @click="handleGenerate" :icon="Refresh">
        重新生成
      </el-button>

      <el-button @click="handleExport" :icon="Camera" :disabled="!store.monthPlan.length">
        导出图片
      </el-button>
    </div>

    <div class="toolbar-right">
      <el-radio-group v-model="store.viewMode" size="default">
        <el-radio-button value="month">月视图</el-radio-button>
        <el-radio-button value="week">周视图</el-radio-button>
      </el-radio-group>

      <template v-if="store.viewMode === 'week' && store.monthPlan.length">
        <el-divider direction="vertical" />
        <el-select v-model="store.currentWeek" style="width: 140px;">
          <el-option
            v-for="(_, idx) in store.monthPlan"
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
import { ArrowLeft, ArrowRight, Refresh, Camera } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useMenuStore } from '../../composables/useMenuStore.js'
import { exportAsImage } from '../../composables/useMenuExport.js'

const store = useMenuStore()

function handleGenerate() {
  if (store.monthPlan.length > 0) {
    ElMessageBox.confirm(
      '重新生成将清除当前菜单，是否继续？',
      '确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    ).then(() => {
      store.generate()
    }).catch(() => {})
  } else {
    store.generate()
  }
}

function handleExport() {
  const filename = `食堂菜单_${store.currentYear}年${store.currentMonth}月`
  exportAsImage('export-area', filename)
}
</script>

<style scoped>
.menu-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  flex-wrap: wrap;
  gap: 12px;
}
.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.month-label {
  min-width: 110px;
  font-weight: 600;
}
</style>
