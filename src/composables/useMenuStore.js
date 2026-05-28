// 菜单状态管理 v2 — 多月支持 + 使用记录
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dishesData from '../data/dishes.json'
import { generateMonths } from '../utils/generator.js'

// 获取某月的工作日日期列表
function getWorkdayDates(year, month) {
  const dates = []
  const d = new Date(year, month - 1, 1)
  while (d.getMonth() === month - 1) {
    const dow = d.getDay()
    if (dow >= 1 && dow <= 5) dates.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

export const useMenuStore = defineStore('menu', () => {
  const currentYear = ref(2026)
  const currentMonth = ref(5)
  const numMonths = ref(1)
  const allPlans = ref([])        // [{ year, month, plan, stats, workdays }]
  const usedHistory = ref({})     // { dishId: '2026-5' }
  const viewMode = ref('month')
  const currentWeek = ref(0)
  const currentViewMonthIdx = ref(0)  // 在多月中查看第几个月
  const lockedDishes = ref(new Set())

  // 当前查看的月份数据
  const currentMonthPlan = computed(() => {
    const m = allPlans.value[currentViewMonthIdx.value]
    return m ? attachDateInfo(m) : []
  })

  const currentStats = computed(() => {
    return allPlans.value[currentViewMonthIdx.value]?.stats || null
  })

  // 给菜单附加日期和星期信息
  function attachDateInfo(monthData) {
    const workdays = monthData.workdays || getWorkdayDates(monthData.year, monthData.month)
    const plan = monthData.plan
    const result = []
    let dateIdx = 0
    for (const week of plan) {
      const weekResult = []
      for (const day of week) {
        const d = dateIdx < workdays.length ? workdays[dateIdx] : null
        weekResult.push({
          date: d ? `${d.getMonth() + 1}/${d.getDate()}` : '',
          weekday: d ? '周' + '一二三四五'[d.getDay() - 1] : '',
          meat: day.meat,
          veg: day.veg,
          theme: day.theme || ''
        })
        dateIdx++
      }
      result.push(weekResult)
    }
    return result
  }

  function generate() {
    const result = generateMonths(dishesData, {
      startYear: currentYear.value,
      startMonth: currentMonth.value,
      numMonths: numMonths.value,
      coolingMonths: 2,
      usedHistory: usedHistory.value
    })

    allPlans.value = result.allPlans
    usedHistory.value = result.usedHistory
    currentViewMonthIdx.value = 0
    currentWeek.value = 0
  }

  function replaceDish(monthIdx, weekIdx, dayIdx, slotType, slotIdx, newDish) {
    const day = allPlans.value[monthIdx].plan[weekIdx][dayIdx]
    if (slotType === 'meat') {
      day.meat[slotIdx] = newDish
    } else {
      day.veg[slotIdx] = newDish
    }
  }

  function navigateMonth(delta) {
    const newIdx = currentViewMonthIdx.value + delta
    if (newIdx >= 0 && newIdx < allPlans.value.length) {
      currentViewMonthIdx.value = newIdx
      currentWeek.value = 0
    } else if (delta > 0 && newIdx >= allPlans.value.length) {
      // 需要生成更多月份
      const lastPlan = allPlans.value[allPlans.value.length - 1]
      const nextMonth = lastPlan.month + 1
      const nextYear = lastPlan.year + (nextMonth > 12 ? 1 : 0)
      const actualNextMonth = nextMonth > 12 ? 1 : nextMonth

      const result = generateMonths(dishesData, {
        startYear: nextYear,
        startMonth: actualNextMonth,
        numMonths: 1,
        coolingMonths: 2,
        usedHistory: usedHistory.value
      })

      allPlans.value.push(...result.allPlans)
      usedHistory.value = result.usedHistory
      currentViewMonthIdx.value = allPlans.value.length - 1
    } else if (delta < 0) {
      currentViewMonthIdx.value = 0
    }
  }

  // 获取某道菜的上次使用时间
  function getLastUsed(dishId) {
    return usedHistory.value[dishId] || null
  }

  return {
    currentYear, currentMonth, numMonths,
    allPlans, usedHistory, viewMode, currentWeek,
    currentViewMonthIdx, lockedDishes,
    currentMonthPlan, currentStats,
    generate, replaceDish, navigateMonth, getLastUsed
  }
})
