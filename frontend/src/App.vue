<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <h1>TJM 票券系統</h1>
        <nav class="header-nav">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ 'is-active': $route.path === item.path }"
          >
            {{ item.label }}
          </router-link>
        </nav>
      </div>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
const navItems = [
  { path: '/', label: '首頁' },
  { path: '/query', label: '查詢報名' },
  { path: '/register', label: '報名登記' }
];
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

.header-nav {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0;
  white-space: nowrap;
}

.nav-link {
  display: inline-block;
  padding: 0 16px;
  height: 60px;
  line-height: 60px;
  color: white;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s, background-color 0.2s;
}

.nav-link:hover {
  color: #409eff;
  background-color: white;
}

.nav-link.is-active {
  color: #409eff;
  background-color: white;
}

.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
</style>