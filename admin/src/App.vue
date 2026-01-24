<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <h1>TJM 票券系統 - 後台管理</h1>
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
        <el-button @click="handleLogout" type="danger" size="small">
          登出
        </el-button>
      </div>
    </el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';

const router = useRouter();

const navItems = [
  { path: '/dashboard', label: '系統首頁' },
  { path: '/statistics', label: '報名詳情' },
  { path: '/pending', label: '待審核名單' },
  { path: '/events', label: '活動管理' },
  { path: '/categories', label: '票券類別' }
  
];

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('確認登出嗎？', '提示', {
      confirmButtonText: '確認',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    router.push('/login');
  } catch (error) {
    // 取消操作
  }
};
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
  padding: 20px;
}
</style>