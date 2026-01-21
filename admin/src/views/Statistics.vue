<template>
  <div class="statistics">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>統計分析</span>
          <el-select
            v-model="selectedEventId"
            placeholder="選擇活動"
            style="width: 300px"
            @change="loadStatistics"
          >
            <el-option label="全部活動" :value="null" />
            <el-option
              v-for="event in events"
              :key="event.id"
              :label="event.name"
              :value="event.id"
            />
          </el-select>
        </div>
      </template>

      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="8">
          <el-statistic title="總票券數" :value="statistics.total">
            <template #suffix>
              <span>張</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="8">
          <el-statistic title="已報到" :value="statistics.checked">
            <template #suffix>
              <span>張</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="8">
          <el-statistic title="未報到" :value="statistics.unchecked">
            <template #suffix>
              <span>張</span>
            </template>
          </el-statistic>
        </el-col>
      </el-row>

      <el-table :data="tickets" border style="width: 100%">
        <el-table-column prop="event_name" label="活動名稱" width="200" />
        <el-table-column prop="category_name" label="票券類別" width="150" />
        <el-table-column prop="phone" label="手機號" width="130" />
        <el-table-column prop="barcode" label="條碼" width="180" />
        <el-table-column prop="checkin_status" label="報到狀態" width="120">
          <template #default="{ row }">
            <el-tag :type="row.checkin_status === 'checked' ? 'success' : 'info'">
              {{ row.checkin_status === 'checked' ? '已報到' : '未報到' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="建立時間" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="checkin_time" label="報到時間" width="180">
          <template #default="{ row }">
            {{ row.checkin_time ? formatDate(row.checkin_time) : '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { adminApi } from '../api';

const events = ref([]);
const selectedEventId = ref(null);
const statistics = reactive({
  total: 0,
  checked: 0,
  unchecked: 0
});
const tickets = ref([]);

onMounted(async () => {
  await loadEvents();
  await loadStatistics();
});

const loadEvents = async () => {
  try {
    const result = await adminApi.getEvents();
    events.value = result.events;
  } catch (error) {
    console.error('載入活動列表失敗:', error);
  }
};

const loadStatistics = async () => {
  try {
    const result = await adminApi.getStatistics(selectedEventId.value);
    statistics.total = result.statistics.total;
    statistics.checked = result.statistics.checked;
    statistics.unchecked = result.statistics.unchecked;
    tickets.value = result.tickets || [];
  } catch (error) {
    console.error('載入統計資訊失敗:', error);
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW');
};
</script>

<style scoped>
.statistics {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>