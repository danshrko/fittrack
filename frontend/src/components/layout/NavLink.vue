<template>
  <router-link :to="to" class="nav-link" :class="{ active: isActive }">
    <span class="nav-text">{{ label }}</span>
  </router-link>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps({
  to: String,
  label: String
});

const route = useRoute();

const isActive = computed(() => route.path === props.to);
</script>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  padding: 0.625rem 1rem;
  color: #666;
  text-decoration: none;
  border-radius: 0;
  transition: all 0.15s;
  margin-bottom: 0;
  font-size: 0.9375rem;
  font-weight: 400;
}

.nav-link:hover {
  background-color: #fafafa;
  color: #1a1a1a;
}

.nav-link.active {
  background-color: transparent;
  color: #1a1a1a;
  font-weight: 400;
  border-left: 2px solid #1a1a1a;
}

.nav-text {
  flex: 1;
}
</style>