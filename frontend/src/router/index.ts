import { createRouter, createWebHashHistory } from 'vue-router';
import LandingPage from '@/views/LandingPage.vue';
import ConverterPage from '@/views/ConverterPage.vue';

const router = createRouter({
  history: createWebHashHistory(),
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
