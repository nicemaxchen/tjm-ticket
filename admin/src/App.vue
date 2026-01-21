<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-content">
        <h1>TJM 票券系統 - 後台管理</h1>
        <el-menu
          mode="horizontal"
          :default-active="$route.path"
          router
          class="header-menu"
        >
          <el-menu-item index="/dashboard">儀表板</el-menu-item>
          <el-menu-item index="/events">活動管理</el-menu-item>
          <el-menu-item index="/categories">票券類別</el-menu-item>
          <el-menu-item index="/pending">待審核名單</el-menu-item>
          <el-menu-item index="/statistics">統計分析</el-menu-item>
        </el-menu>
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
  padding: 20px;
}
</style>