<template>
  <div class="auth-layout">
    <div class="auth-card">
      <div class="auth-logo">
        <h1>MTI-HUB</h1>
        <p>Billing System</p>
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
  justify-content: center;
  background: #f0f2f5;
}
.auth-card {
  background: #fff;
  border-radius: 8px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 2px 12px rgba(0,0,0,.1);
}
.auth-logo {
  text-align: center;
  margin-bottom: 32px;
}
.auth-logo h1 {
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
  margin: 0;
}
.auth-logo p {
  color: #909399;
  margin: 4px 0 0;
}
</style>
