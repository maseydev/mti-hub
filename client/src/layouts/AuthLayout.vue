<template>
  <div class="auth-layout">
    <div class="auth-product">
      <span class="product-mark">M</span>
      <div>
        <span class="product-title">MTI-HUB</span>
        <span class="product-subtitle">billing control center</span>
      </div>
    </div>
    <div class="auth-card">
      <div class="auth-logo">
        <h1>Вход в систему</h1>
        <p>Управление клиентами, оплатами и финансами студии</p>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
  padding: 48px;
  background: var(--app-bg);
}
.auth-product {
  display: flex;
  align-items: center;
  gap: 18px;
  align-self: start;
  flex: 1;
  color: var(--app-text);
}
.product-mark {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border: 1px solid rgba(53, 194, 164, 0.42);
  border-radius: 8px;
  background: var(--app-accent-soft);
  color: var(--app-accent-strong);
  font-size: 24px;
  font-weight: 850;
}
.product-title {
  display: block;
  font-size: 30px;
  line-height: 1;
  font-weight: 850;
}
.product-subtitle {
  display: block;
  margin-top: 8px;
  color: var(--app-text-muted);
  font-size: 12px;
  text-transform: uppercase;
}
.auth-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  padding: 40px;
  min-width: 0;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 22px 64px rgba(0, 0, 0, 0.34);
}
.auth-logo {
  text-align: left;
  margin-bottom: 32px;
}
.auth-logo h1 {
  font-size: 28px;
  line-height: 1.15;
  font-weight: 800;
  color: var(--app-text);
  margin: 0;
}
.auth-logo p {
  color: var(--app-text-muted);
  margin: 10px 0 0;
  line-height: 1.5;
}
@media (max-width: 820px) {
  .auth-layout {
    flex-direction: column;
    align-items: stretch;
    gap: 28px;
    padding: 24px;
  }
  .auth-card {
    padding: 32px 24px;
    max-width: none;
  }
  .product-title {
    font-size: 28px;
  }
}
</style>
