<template>
  <div class="home">
    <el-card class="welcome-card">
      <h2>歡迎使用 TJM 票券系統</h2>
      <p>您可以查詢已報名的票券或進行新的報名登記</p>
    </el-card>

    <el-row :gutter="20" class="feature-cards">
      <el-col :span="12">
        <el-card class="feature-card" @click="$router.push('/query')">
          <el-icon :size="48" color="#409eff"><Search /></el-icon>
          <h3>查詢報名資料</h3>
          <p>透過手機號查詢已報名的票券，查看條碼並報到</p>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="feature-card" @click="$router.push('/register')">
          <el-icon :size="48" color="#67c23a"><Edit /></el-icon>
          <h3>登記報名資料</h3>
          <p>填寫報名資訊，完成報名並取得票券</p>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="events-card" v-if="events.length > 0">
      <template #header>
        <span>近期活動</span>
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
            <p v-if="event.location" style="color: #666; margin-top: 8px;">
              <el-icon :size="16" style="vertical-align: middle; margin-right: 4px;"><Location /></el-icon>{{ event.location }}
            </p>
            <p v-if="event.max_attendees > 0" style="color: #666; margin-top: 8px;">
              <el-icon :size="16" style="vertical-align: middle; margin-right: 4px;"><User /></el-icon>索票最大人數：{{ event.max_attendees }} 人
            </p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Search, Edit, Location, User } from '@element-plus/icons-vue';
import { ticketApi } from '../api';

const events = ref([]);

onMounted(async () => {
  try {
    const result = await ticketApi.getEvents();
    events.value = result.events.slice(0, 5); // 只顯示最近5個活動
  } catch (error) {
    console.error('取得活動列表失敗:', error);
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