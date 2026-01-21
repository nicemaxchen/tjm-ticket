<template>
  <div class="dashboard">
    <el-card>
      <template #header>
        <span>活動統計</span>
      </template>
      <el-table :data="eventStats" border style="width: 100%">
        <el-table-column prop="event_name" label="活動名稱" width="200" />
        <el-table-column prop="event_date" label="活動日期" width="180">
          <template #default="{ row }">
            {{ formatDate(row.event_date) }}
          </template>
        </el-table-column>
        <el-table-column label="票數上限" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.max_attendees > 0 ? 'info' : 'warning'">
              {{ row.max_attendees > 0 ? `${row.max_attendees}人` : '無限制' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="總票券數" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.totalTickets }}張</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已報到" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.checkedTickets }}張</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="未報到" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.uncheckedTickets }}張</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="待審核" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.pendingCount }}條</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="$router.push(`/statistics?eventId=${row.event_id}`)"
            >
              詳情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
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
import { ElMessage } from 'element-plus';
import { adminApi } from '../api';

const eventStats = ref([]);
const pendingList = ref([]);

onMounted(async () => {
  await loadDashboard();
});

const loadDashboard = async () => {
  try {
    // 取得待審核名單
    const pendingResult = await adminApi.getPendingList();
    pendingList.value = pendingResult.pendingList.slice(0, 5);

    // 嘗試使用新的 API，如果失敗則使用備用方法
    try {
      const statsResult = await adminApi.getStatisticsByEvents();
      if (statsResult && statsResult.success && statsResult.eventStats) {
        eventStats.value = statsResult.eventStats;
        console.log('使用新 API 載入數據:', eventStats.value);
        return;
      }
    } catch (apiError) {
      console.warn('新 API 失敗，使用備用方法:', apiError);
    }

    // 備用方法：使用舊的 API 組合
    const eventsResult = await adminApi.getEvents();
    if (!eventsResult || !eventsResult.events || eventsResult.events.length === 0) {
      console.warn('沒有活動數據');
      eventStats.value = [];
      return;
    }

    const statsPromises = eventsResult.events.map(async (event) => {
      try {
        const statsResult = await adminApi.getStatistics(event.id);
        const pendingForEvent = pendingResult.pendingList.filter(p => p.event_id === event.id).length;
        
        return {
          event_id: event.id,
          event_name: event.name,
          event_date: event.event_date,
          max_attendees: event.max_attendees || 0,
          totalTickets: statsResult.statistics ? statsResult.statistics.total || 0 : 0,
          checkedTickets: statsResult.statistics ? statsResult.statistics.checked || 0 : 0,
          uncheckedTickets: statsResult.statistics ? statsResult.statistics.unchecked || 0 : 0,
          pendingCount: pendingForEvent
        };
      } catch (err) {
        console.error(`載入活動 ${event.id} 統計失敗:`, err);
        return {
          event_id: event.id,
          event_name: event.name,
          event_date: event.event_date,
          max_attendees: event.max_attendees || 0,
          totalTickets: 0,
          checkedTickets: 0,
          uncheckedTickets: 0,
          pendingCount: 0
        };
      }
    });

    eventStats.value = await Promise.all(statsPromises);
    console.log('使用備用方法載入數據:', eventStats.value);
  } catch (error) {
    console.error('載入儀表板資料失敗:', error);
    ElMessage.error(`載入儀表板資料失敗: ${error.message || '未知錯誤'}`);
    eventStats.value = [];
    pendingList.value = [];
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