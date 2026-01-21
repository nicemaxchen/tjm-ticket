<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-statistic title="總活動數" :value="stats.totalEvents">
          <template #suffix>
            <span>個</span>
          </template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="總票券數" :value="stats.totalTickets">
          <template #suffix>
            <span>張</span>
          </template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="已報到" :value="stats.checkedTickets">
          <template #suffix>
            <span>張</span>
          </template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="待審核" :value="stats.pendingCount">
          <template #suffix>
            <span>條</span>
          </template>
        </el-statistic>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近活動</span>
          </template>
          <el-table :data="recentEvents" style="width: 100%">
            <el-table-column prop="name" label="活動名稱" />
            <el-table-column prop="event_date" label="活動日期" width="180">
              <template #default="{ row }">
                {{ formatDate(row.event_date) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="$router.push(`/events?eventId=${row.id}`)"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>待審核名單</span>
          </template>
          <el-table :data="pendingList" style="width: 100%">
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="phone" label="手機號" width="120" />
            <el-table-column prop="event_name" label="活動" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="$router.push('/pending')"
                >
                  審核
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { adminApi } from '../api';

const stats = ref({
  totalEvents: 0,
  totalTickets: 0,
  checkedTickets: 0,
  pendingCount: 0
});

const recentEvents = ref([]);
const pendingList = ref([]);

onMounted(async () => {
  await loadDashboard();
});

const loadDashboard = async () => {
  try {
    // 取得活動列表
    const eventsResult = await adminApi.getEvents();
    recentEvents.value = eventsResult.events.slice(0, 5);
    stats.value.totalEvents = eventsResult.events.length;

    // 取得統計資訊
    const statsResult = await adminApi.getStatistics();
    stats.value.totalTickets = statsResult.statistics.total;
    stats.value.checkedTickets = statsResult.statistics.checked;

    // 取得待審核名單
    const pendingResult = await adminApi.getPendingList();
    pendingList.value = pendingResult.pendingList.slice(0, 5);
    stats.value.pendingCount = pendingResult.pendingList.length;
  } catch (error) {
    console.error('載入儀表板資料失敗:', error);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW');
};
</script>

<style scoped>
.dashboard {
  padding: 20px;
}
</style>