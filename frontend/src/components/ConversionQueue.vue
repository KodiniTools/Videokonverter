<script setup lang="ts">
import { useConversionStore } from '@/stores/conversion';
import { useI18n } from '@/composables/useI18n';
import ConversionItem from './ConversionItem.vue';

const conversionStore = useConversionStore();
const { t } = useI18n();
</script>

<template>
  <div v-if="conversionStore.jobs.length > 0" class="conversion-queue">
    <h2>{{ t('conversionQueue') }}</h2>

    <div class="queue-list">
      <ConversionItem
        v-for="job in conversionStore.jobs"
        :key="job.id"
        :job="job"
      />
    </div>
  </div>
</template>

<style scoped>
.conversion-queue {
  width: 100%;
  max-width: 600px;
  margin: 32px auto 0;
}

h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .conversion-queue {
    margin-top: 24px;
  }
}

@media (max-width: 480px) {
  .conversion-queue {
    margin-top: 20px;
  }

  h2 {
    font-size: 16px;
    margin-bottom: 12px;
  }
}
</style>
