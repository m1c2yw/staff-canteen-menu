// 菜单状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dishesData from '../data/dishes.json'
import { generateMonth } from '../utils/generator.js'

// 获取当前月份的工作日日期
function getWorkdayDates(year, month) {
  const dates = []
  const day = new Date(year, month - 1, 1)
  while (day.getMonth() === month - 1) {
    const dow = day.getDay() // 0=周日
    if (dow >= 1 && dow <= 5) {
      dates.push(new Date(day))
    }
    day.setDate(day.getDate() + 1)
  }
  return dates
}

export const useMenuStore = defineStore('menu', () => {
  const currentYear = ref(2026)
  const currentMonth = ref(5)
  const monthPlan = ref([])  // monthPlan[week][day] = { date: '...', meat: [], veg: [] }
  const viewMode = ref('month')  // 'month' | 'week'
  const currentWeek = ref(0)
  const lockedDishes = ref(new Set())
  const statistics = ref(null)

  const workdayDates = computed(() => getWorkdayDates(currentYear.value, currentMonth.value))

  const allDishesInMonth = computed(() => {
    const dishes = []
    monthPlan.value.flat().forEach(day => {
      dishes.push(...day.meat, ...day.veg)
    })
    return dishes
  })

  function generate() {
    const dates = workdayDates.value
    const { monthPlan: plan, statistics: stats } = generateMonth(dishesData, {
      year: currentYear.value,
      month: currentMonth.value,
      lockedIds: lockedDishes.value
    })

    // 给每天附加日期信息
    let dateIdx = 0
    const result = []
    for (let w = 0; w < plan.length; w++) {
      const week = []
      for (let d = 0; d < plan[w].length; d++) {
        const dateStr = dateIdx < dates.length
          ? `${dates[dateIdx].getMonth() + 1}/${dates[dateIdx].getDate()}`
          : ''
        week.push({
          date: dateStr,
          weekday: '周' + '一二三四五'[d],
          meat: plan[w][d].meat,
          veg: plan[w][d].veg
        })
        dateIdx++
      }
      result.push(week)
    }

    monthPlan.value = result
    statistics.value = stats
  }

  function replaceDish(weekIdx, dayIdx, slotType, slotIdx, newDish) {
    const day = monthPlan.value[weekIdx][dayIdx]
    if (slotType === 'meat') {
      day.meat[slotIdx] = newDish
    } else {
      day.veg[slotIdx] = newDish
    }
  }

  function toggleLock(dishId) {
    const newSet = new Set(lockedDishes.value)
    if (newSet.has(dishId)) {
      newSet.delete(dishId)
    } else {
      newSet.add(dishId)
    }
    lockedDishes.value = newSet
  }

  function navigateMonth(delta) {
    let m = currentMonth.value + delta
    let y = currentYear.value
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    currentYear.value = y
    currentMonth.value = m
    monthPlan.value = []
    statistics.value = null
  }

  return {
    currentYear,
    currentMonth,
    monthPlan,
    viewMode,
    currentWeek,
    lockedDishes,
    statistics,
    workdayDates,
    allDishesInMonth,
    generate,
    replaceDish,
    toggleLock,
    navigateMonth
  }
})
