import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/auth/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/auth/Register.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('../views/auth/ForgotPassword.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('../views/auth/ResetPassword.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/user/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/user/Profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/exercises',
      name: 'Exercises',
      component: () => import('../views/user/Exercises.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/templates',
      name: 'Templates',
      component: () => import('../views/user/Templates.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/templates/create',
      name: 'TemplateCreate',
      component: () => import('../views/user/TemplateForm.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/templates/:id/edit',
      name: 'TemplateEdit',
      component: () => import('../views/user/TemplateForm.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/workout/start',
      name: 'StartWorkout',
      component: () => import('../views/user/StartWorkout.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/workout/start/:id',
      name: 'StartWorkoutFromTemplate',
      component: () => import('../views/user/StartWorkout.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/history',
      name: 'History',
      component: () => import('../views/user/History.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'AdminDashboard',
      component: () => import('../views/admin/Dashboard.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/exercises',
      name: 'AdminExercises',
      component: () => import('../views/admin/Exercises.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/users',
      name: 'AdminUsers',
      component: () => import('../views/admin/Users.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    }
  ]
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    next('/');
  } else if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;