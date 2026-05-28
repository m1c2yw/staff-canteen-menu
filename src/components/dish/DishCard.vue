<template>
  <div class="dish-card" :class="{ compact }">
    <span class="dish-icon">{{ ingredientIcon }}</span>
    <span class="dish-name">{{ dish.name }}</span>
    <template v-if="!compact">
      <el-tag
        :color="cuisineColor"
        size="small"
        effect="dark"
        class="cuisine-tag"
      >
        {{ dish.cuisine }}
      </el-tag>
    </template>
    <span class="spice-icons">{{ spiceStr }}</span>
    <span v-if="!compact" class="cooking-method">{{ dish.cookingMethod }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { INGREDIENT_ICONS, CUISINE_COLORS } from '../../data/constants.js'

const props = defineProps({
  dish: { type: Object, required: true },
  compact: { type: Boolean, default: false }
})

const ingredientIcon = computed(() => {
  return INGREDIENT_ICONS[props.dish.mainIngredient] || '🍽️'
})

const spiceStr = computed(() => {
  const level = props.dish.spiciness || 1
  if (level === 1) return '☆'
  return '🌶'.repeat(Math.min(level, 5))
})

const cuisineColor = computed(() => {
  return CUISINE_COLORS[props.dish.cuisine] || '#7f8c8d'
})
</script>

<style scoped>
.dish-card {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  line-height: 1.8;
}
.dish-card.compact {
  font-size: 12.5px;
  gap: 4px;
}
.dish-icon {
  flex-shrink: 0;
  font-size: 14px;
}
.dish-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.compact .dish-name {
  max-width: 100px;
}
.spice-icons {
  flex-shrink: 0;
  font-size: 11px;
  margin-left: auto;
}
.cuisine-tag {
  flex-shrink: 0;
  font-size: 11px;
  padding: 0 4px;
  height: 18px;
  line-height: 18px;
}
.cooking-method {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-secondary);
  background: #f4f4f5;
  padding: 0 3px;
  border-radius: 2px;
}
</style>
