<template>
  <div class="home">
    <el-card class="welcome-card">
      <h2>欢迎使用 TJM 票券系统</h2>
      <p>您可以查询已报名的票券或进行新的报名登记</p>
    </el-card>

    <el-row :gutter="20" class="feature-cards">
      <el-col :span="12">
        <el-card class="feature-card" @click="$router.push('/query')">
          <el-icon :size="48" color="#409eff"><Search /></el-icon>
          <h3>查询报名资料</h3>
          <p>通过手机号查询已报名的票券，查看条码并报到</p>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="feature-card" @click="$router.push('/register')">
          <el-icon :size="48" color="#67c23a"><Edit /></el-icon>
          <h3>登记报名资料</h3>
          <p>填写报名信息，完成报名并获取票券</p>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="events-card" v-if="events.length > 0">
      <template #header>
        <span>近期活动</span>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="event in events"
          :key="event.id"
          :timestamp="formatDate(event.event_date)"
          placement="top"
        >
          <el-card>
            <h4>{{ event.name }}</h4>
            <p>{{ event.description }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Search, Edit } from '@element-plus/icons-vue';
import { ticketApi } from '../api';

const events = ref([]);

onMounted(async () => {
  try {
    const result = await ticketApi.getEvents();
    events.value = result.events.slice(0, 5); // 只显示最近5个活动
  } catch (error) {
    console.error('获取活动列表失败:', error);
  }
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW');
};
</script>

<style scoped>
.home {
  padding: 20px;
}

.welcome-card {
  margin-bottom: 20px;
  text-align: center;
}

.welcome-card h2 {
  margin: 0 0 10px 0;
  color: #409eff;
}

.feature-cards {
  margin-bottom: 30px;
}

.feature-card {
  cursor: pointer;
  text-align: center;
  transition: transform 0.3s;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.feature-card h3 {
  margin: 15px 0 10px 0;
}

.feature-card p {
  color: #666;
  margin: 0;
}

.events-card {
  margin-top: 20px;
}
</style>