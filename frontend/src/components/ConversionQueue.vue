<script setup lang="ts">
import { useConversionStore } from '@/stores/conversion';
import ConversionItem from './ConversionItem.vue';

const conversionStore = useConversionStore();
</script>

<template>
  <div v-if="conversionStore.jobs.length > 0" class="conversion-queue">
    <h2>Konvertierungswarteschlange</h2>

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
</style>
