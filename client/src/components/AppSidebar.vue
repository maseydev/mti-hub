<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <span class="logo-text">MTI-HUB</span>
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
  width: 220px;
  min-height: 100vh;
  background: #001529;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.sidebar-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #0d2137;
}
.logo-text {
  color: #409eff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
}
.sidebar-menu {
  background: transparent !important;
  border-right: none !important;
  flex: 1;
}
:deep(.el-menu-item) {
  color: #ffffffa0 !important;
}
:deep(.el-menu-item:hover),
:deep(.el-menu-item.is-active) {
  background: #1890ff20 !important;
  color: #409eff !important;
}
:deep(.el-divider) {
  border-color: #0d2137 !important;
  margin: 8px 0;
}
</style>
