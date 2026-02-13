<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';
import { RouterLink } from 'vue-router';

const { t } = useI18n();
</script>

<template>
  <div class="landing">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">FFmpeg Powered</div>
        <h1 class="hero-title">{{ t('heroTitle') }}</h1>
        <p class="hero-subtitle">{{ t('heroSubtitle') }}</p>
        <div class="hero-formats">
          <span class="format-tag">MP4</span>
          <span class="format-tag">WebM</span>
          <span class="format-tag">AVI</span>
          <span class="format-tag">MOV</span>
          <span class="format-tag">MKV</span>
          <span class="format-tag">FLV</span>
          <span class="format-tag">WMV</span>
          <span class="format-tag">TS</span>
        </div>
        <RouterLink to="/converter" class="hero-cta">
          {{ t('heroCta') }}
          <svg class="cta-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </RouterLink>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="features">
      <div class="features-grid">
        <!-- Feature Card 1 -->
        <article class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="feature-title">{{ t('feature1Title') }}</h3>
          <p class="feature-description">{{ t('feature1Description') }}</p>
        </article>

        <!-- Feature Card 2 -->
        <article class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="feature-title">{{ t('feature2Title') }}</h3>
          <p class="feature-description">{{ t('feature2Description') }}</p>
        </article>

        <!-- Feature Card 3 -->
        <article class="feature-card">
          <div class="feature-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="feature-title">{{ t('feature3Title') }}</h3>
          <p class="feature-description">{{ t('feature3Description') }}</p>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Hero Section */
.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 32px;
  background: var(--color-surface);
}

.hero-content {
  max-width: 700px;
  text-align: center;
}

.hero-badge {
  display: inline-block;
  padding: 6px 14px;
  background: var(--color-secondary);
  color: #003971;
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
  margin-bottom: 24px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hero-title {
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.1;
  margin-bottom: 24px;
}

.hero-subtitle {
  font-size: 18px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 32px;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  background: var(--color-primary);
  color: var(--color-text-on-primary);
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px rgba(1, 79, 153, 0.3);
}

.hero-cta:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 57, 113, 0.4);
}

.cta-arrow {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.hero-cta:hover .cta-arrow {
  transform: translateX(4px);
}

.hero-formats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 32px;
}

.format-tag {
  padding: 6px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

/* Features Section */
.features {
  flex: 1;
  padding: 80px 32px;
  background: var(--color-background);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.feature-icon {
  width: 56px;
  height: 56px;
  background: var(--color-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-icon svg {
  width: 28px;
  height: 28px;
  color: var(--color-text-on-primary);
}

.feature-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
}

.feature-description {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 768px) {
  .hero {
    padding: 48px 20px;
  }

  .hero-subtitle {
    font-size: 16px;
    margin-bottom: 24px;
  }

  .hero-cta {
    padding: 14px 28px;
    font-size: 15px;
    width: 100%;
    justify-content: center;
  }

  .hero-formats {
    gap: 6px;
    margin-bottom: 24px;
  }

  .features {
    padding: 48px 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .feature-card {
    padding: 24px;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 32px 16px;
  }

  .hero-badge {
    font-size: 11px;
    padding: 5px 12px;
    margin-bottom: 16px;
  }

  .hero-subtitle {
    font-size: 15px;
  }

  .hero-formats {
    gap: 5px;
  }

  .format-tag {
    padding: 4px 10px;
    font-size: 11px;
  }

  .features {
    padding: 32px 16px;
  }

  .feature-card {
    padding: 20px;
  }

  .feature-icon {
    width: 48px;
    height: 48px;
  }

  .feature-icon svg {
    width: 24px;
    height: 24px;
  }

  .feature-title {
    font-size: 18px;
  }

  .feature-description {
    font-size: 14px;
  }
}
</style>
