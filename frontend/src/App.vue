<template>
  <div id="app">
    <Navbar v-if="isAuthenticated" />
    <main :class="{ 'with-sidebar': isAuthenticated }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from './stores/auth';
import Navbar from './components/layout/Navbar.vue';

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
}

main {
  flex: 1;
  padding: 2rem;
}

main.with-sidebar {
  margin-left: 250px;
}

@media (max-width: 768px) {
  main.with-sidebar {
    margin-left: 0;
  }
}
</style>