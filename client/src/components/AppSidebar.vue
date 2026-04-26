<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <span class="logo-mark">M</span>
      <div>
        <span class="logo-text">MTI-HUB</span>
        <span class="logo-subtitle">studio finance</span>
      </div>
    </div>
    <el-menu
      :default-active="route.path"
      router
      class="sidebar-menu"
    >
      <el-menu-item index="/dashboard">
        <el-icon><Odometer /></el-icon>
        <span>Дашборд</span>
      </el-menu-item>
      <el-menu-item index="/clients">
        <el-icon><User /></el-icon>
        <span>Клиенты</span>
      </el-menu-item>
      <el-menu-item index="/projects">
        <el-icon><Files /></el-icon>
        <span>Проекты</span>
      </el-menu-item>
      <el-menu-item index="/services">
        <el-icon><Refresh /></el-icon>
        <span>Услуги и продления</span>
      </el-menu-item>
      <el-menu-item index="/billing">
        <el-icon><CreditCard /></el-icon>
        <span>Счета к оплате</span>
      </el-menu-item>
      <el-menu-item index="/transactions">
        <el-icon><Money /></el-icon>
        <span>Транзакции</span>
      </el-menu-item>
      <el-divider />
      <el-menu-item index="/categories">
        <el-icon><Collection /></el-icon>
        <span>Категории</span>
      </el-menu-item>
      <el-menu-item index="/accounts">
        <el-icon><Wallet /></el-icon>
        <span>Счета и кошельки</span>
      </el-menu-item>
      <el-menu-item index="/telegram">
        <el-icon><ChatDotRound /></el-icon>
        <span>Telegram</span>
      </el-menu-item>
    </el-menu>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<style scoped>
.sidebar {
  width: 264px;
  min-height: 100vh;
  background: #0f1217;
  border-right: 1px solid var(--app-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.sidebar-logo {
  min-height: 68px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--app-border);
}
.logo-mark {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid rgba(53, 194, 164, 0.42);
  border-radius: 8px;
  background: var(--app-accent-soft);
  color: var(--app-accent-strong);
  font-weight: 800;
}
.logo-text {
  display: block;
  color: var(--app-text);
  font-size: 17px;
  line-height: 1.1;
  font-weight: 800;
}
.logo-subtitle {
  display: block;
  margin-top: 3px;
  color: var(--app-text-muted);
  font-size: 11px;
  text-transform: uppercase;
}
.sidebar-menu {
  background: transparent !important;
  border-right: none !important;
  flex: 1;
  padding: 12px;
}
:deep(.el-menu-item) {
  height: 42px;
  margin: 3px 0;
  border-radius: 8px;
  color: var(--app-text-muted) !important;
  font-weight: 650;
}
:deep(.el-menu-item .el-icon) {
  color: #7d8a9b;
}
:deep(.el-menu-item:hover),
:deep(.el-menu-item.is-active) {
  background: var(--app-accent-soft) !important;
  color: var(--app-text) !important;
}
:deep(.el-menu-item.is-active .el-icon) {
  color: var(--app-accent-strong);
}
:deep(.el-divider) {
  border-color: var(--app-border) !important;
  margin: 10px 0;
}
@media (max-width: 900px) {
  .sidebar {
    width: 100%;
    min-height: auto;
  }
  .sidebar-menu {
    display: flex;
    overflow-x: auto;
    padding: 10px;
  }
  :deep(.el-menu-item) {
    flex: 0 0 auto;
  }
  :deep(.el-divider) {
    display: none;
  }
}
</style>
