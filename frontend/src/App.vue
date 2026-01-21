<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <h1>TJM 票券系統</h1>
        <el-menu
          mode="horizontal"
          :default-active="$route.path"
          router
          class="header-menu"
        >
          <el-menu-item index="/">首頁</el-menu-item>
          <el-menu-item index="/query">查詢報名</el-menu-item>
          <el-menu-item index="/register">報名登記</el-menu-item>
        </el-menu>
      </div>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { ref } from 'vue';
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}

.app-header {
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
}

.header-menu {
  background-color: transparent;
  border-bottom: none;
}

:deep(.el-menu-item) {
  color: white;
}

:deep(.el-menu-item:hover),
:deep(.el-menu-item.is-active) {
  color: #409eff;
  background-color: white;
}

.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
</style>