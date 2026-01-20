<template>
  <div class="statistics">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>统计分析</span>
          <el-select
            v-model="selectedEventId"
            placeholder="选择活动"
            style="width: 300px"
            @change="loadStatistics"
          >
            <el-option label="全部活动" :value="null" />
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
          <el-statistic title="总票券数" :value="statistics.total">
            <template #suffix>
              <span>张</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="8">
          <el-statistic title="已报到" :value="statistics.checked">
            <template #suffix>
              <span>张</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="8">
          <el-statistic title="未报到" :value="statistics.unchecked">
            <template #suffix>
              <span>张</span>
            </template>
          </el-statistic>
        </el-col>
      </el-row>

      <el-table :data="tickets" border style="width: 100%">
        <el-table-column prop="event_name" label="活动名称" width="200" />
        <el-table-column prop="category_name" label="票券类别" width="150" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="barcode" label="条码" width="180" />
        <el-table-column prop="checkin_status" label="报到状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.checkin_status === 'checked' ? 'success' : 'info'">
              {{ row.checkin_status === 'checked' ? '已报到' : '未报到' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="checkin_time" label="报到时间" width="180">
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
    console.error('加载活动列表失败:', error);
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
    console.error('加载统计信息失败:', error);
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