import { createRouter, createWebHistory } from 'vue-router';
import LandingPage from '@/views/LandingPage.vue';
import ConverterPage from '@/views/ConverterPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingPage,
    },
    {
      path: '/converter',
      name: 'converter',
      component: ConverterPage,
    },
  ],
});

export default router;
