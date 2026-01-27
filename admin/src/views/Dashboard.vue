<template>
  <div class="dashboard">
    <el-card>
      <template #header>
        <span>活動統計</span>
      </template>
      <el-table :data="eventStats" border style="width: 100%">
        <el-table-column prop="event_name" label="活動名稱" header-align="center" />
        <el-table-column prop="event_date" label="活動日期" width="180" header-align="center">
          <template #default="{ row }">
            {{ formatDate(row.event_date) }}
          </template>
        </el-table-column>
        <el-table-column label="票數上限" width="120" align="center" header-align="center">
          <template #default="{ row }">
            <el-tag :type="row.max_attendees > 0 ? 'info' : 'warning'">
              {{ row.max_attendees > 0 ? `${row.max_attendees}人` : '無限制' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="總開票數" width="120" align="center" header-align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.totalTickets }}張</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="已報到" width="120" align="center" header-align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.checkedTickets }}張</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="未報到" width="120" align="center" header-align="center">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.uncheckedTickets }}張</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="待審核" width="120" align="center" header-align="center">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.pendingCount }}條</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" header-align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="$router.push(`/statistics?eventId=${row.event_id}`)"
            >
              報名詳情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col 
        v-for="event in eventStats" 
        :key="event.event_id" 
        :span="24"
        style="margin-bottom: 20px;"
      >
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>{{ event.event_name }}</span>
              <el-radio-group
                v-model="chartModeByEvent[event.event_id]"
                size="small"
                style="margin-right: 0;"
              >
                <el-radio-button label="all">全部統計</el-radio-button>
                <el-radio-button label="identity">依身份統計</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <!-- 全部統計：票數/開票數、報到狀態 -->
          <div
            v-if="(chartModeByEvent[event.event_id] ?? 'all') === 'all'"
            style="display: flex; justify-content: space-around; align-items: center; min-height: 350px; gap: 20px;"
          >
            <div style="flex: 1; text-align: center; padding: 0 10px;">
              <div style="font-weight: bold; margin-bottom: 10px;">票數/開票數</div>
              <v-chart
                :option="getTicketRatioOptionAll(event)"
                style="height: 300px; width: 100%;"
              />
            </div>
            <div style="flex: 1; text-align: center; padding: 0 10px;">
              <div style="font-weight: bold; margin-bottom: 10px;">報到狀態</div>
              <v-chart
                :option="getCheckinStatusOptionAll(event)"
                style="height: 300px; width: 100%;"
              />
            </div>
          </div>
          <!-- 依身份統計：貴賓/一般 各二圖 -->
          <div
            v-else
            style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; min-height: 350px;"
          >
            <div style="text-align: center; padding: 0 10px;">
              <div style="font-weight: bold; margin-bottom: 10px;">貴賓票數/開票數</div>
              <v-chart
                :option="getTicketRatioOption(event, 'vip')"
                style="height: 300px; width: 100%;"
              />
            </div>
            <div style="text-align: center; padding: 0 10px;">
              <div style="font-weight: bold; margin-bottom: 10px;">一般票數/開票數</div>
              <v-chart
                :option="getTicketRatioOption(event, 'general')"
                style="height: 300px; width: 100%;"
              />
            </div>
            <div style="text-align: center; padding: 0 10px;">
              <div style="font-weight: bold; margin-bottom: 10px;">貴賓報到狀態</div>
              <v-chart
                :option="getCheckinStatusOption(event, 'vip')"
                style="height: 300px; width: 100%;"
              />
            </div>
            <div style="text-align: center; padding: 0 10px;">
              <div style="font-weight: bold; margin-bottom: 10px;">一般報到狀態</div>
              <v-chart
                :option="getCheckinStatusOption(event, 'general')"
                style="height: 300px; width: 100%;"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { adminApi } from '../api';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components';
import VChart from 'vue-echarts';

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
]);

const eventStats = ref([]);
const pendingList = ref([]);
const chartModeByEvent = reactive({});

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
        initChartModeByEvent(eventStats.value);
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
        const [statsResult, pendingResultForEvent, categoriesResult] = await Promise.all([
          adminApi.getStatistics(event.id),
          adminApi.getPendingList(event.id),
          adminApi.getCategories(event.id)
        ]);
        
        const ticketsWithIdentity = statsResult.tickets || [];
        const pendingForEvent = pendingResultForEvent.pendingList || [];
        const categories = categoriesResult.categories || [];
        
        // 建立 category_id 到 identity_type 的映射
        const categoryIdentityMap = {};
        categories.forEach(cat => {
          categoryIdentityMap[cat.id] = cat.identity_type || 'general';
        });
        
        // 按身份分類統計票券
        const vipTickets = ticketsWithIdentity.filter(t => {
          const identityType = t.identity_type || categoryIdentityMap[t.ticket_category_id] || 'general';
          return identityType === 'vip';
        });
        const generalTickets = ticketsWithIdentity.filter(t => {
          const identityType = t.identity_type || categoryIdentityMap[t.ticket_category_id] || 'general';
          return identityType === 'general';
        });
        
        const vipChecked = vipTickets.filter(t => t.checkin_status === 'checked').length;
        const vipUnchecked = vipTickets.length - vipChecked;
        const generalChecked = generalTickets.filter(t => t.checkin_status === 'checked').length;
        const generalUnchecked = generalTickets.length - generalChecked;
        
        // 按身份分類統計待審核
        const vipPending = pendingForEvent.filter(p => {
          const identityType = categoryIdentityMap[p.ticket_category_id] || 'general';
          return identityType === 'vip';
        }).length;
        const generalPending = pendingForEvent.filter(p => {
          const identityType = categoryIdentityMap[p.ticket_category_id] || 'general';
          return identityType === 'general';
        }).length;
        
        const total = statsResult.statistics ? statsResult.statistics.total || 0 : 0;
        const checked = statsResult.statistics ? statsResult.statistics.checked || 0 : 0;
        const unchecked = statsResult.statistics ? statsResult.statistics.unchecked || 0 : 0;
        const pendingCount = pendingForEvent.length;
        
        return {
          event_id: event.id,
          event_name: event.name,
          event_date: event.event_date,
          max_attendees: event.max_attendees || 0,
          totalTickets: total,
          checkedTickets: checked,
          uncheckedTickets: unchecked,
          pendingCount: pendingCount,
          vipTotal: vipTickets.length,
          vipChecked: vipChecked,
          vipUnchecked: vipUnchecked,
          vipPending: vipPending,
          generalTotal: generalTickets.length,
          generalChecked: generalChecked,
          generalUnchecked: generalUnchecked,
          generalPending: generalPending
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
          pendingCount: 0,
          vipTotal: 0,
          vipChecked: 0,
          vipUnchecked: 0,
          vipPending: 0,
          generalTotal: 0,
          generalChecked: 0,
          generalUnchecked: 0,
          generalPending: 0
        };
      }
    });

    eventStats.value = await Promise.all(statsPromises);
    initChartModeByEvent(eventStats.value);
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

const initChartModeByEvent = (events) => {
  if (!events || !events.length) return;
  events.forEach((e) => {
    const id = e.event_id;
    if (chartModeByEvent[id] === undefined) chartModeByEvent[id] = 'all';
  });
};

const getTicketRatioOptionAll = (event) => {
  const maxAttendees = event.max_attendees || 0;
  const totalTickets = event.totalTickets || 0;
  let data = [];
  if (maxAttendees > 0) {
    const remaining = Math.max(0, maxAttendees - totalTickets);
    data = [
      { value: totalTickets, name: '開票數', itemStyle: { color: '#409eff' } },
      { value: remaining, name: '剩餘', itemStyle: { color: '#e4e7ed' } }
    ];
  } else {
    data = [{ value: totalTickets, name: '開票數', itemStyle: { color: '#409eff' } }];
  }
  if (data.every((item) => item.value === 0)) {
    data = [{ value: 1, name: '無數據', itemStyle: { color: '#e4e7ed' } }];
  }
  return pieBaseOption('票數統計', data);
};

const getCheckinStatusOptionAll = (event) => {
  const checked = event.checkedTickets || 0;
  const unchecked = event.uncheckedTickets || 0;
  const pending = event.pendingCount || 0;
  let data = [
    { value: checked, name: '已報到', itemStyle: { color: '#67c23a' } },
    { value: unchecked, name: '未報到', itemStyle: { color: '#f56c6c' } },
    { value: pending, name: '待審核', itemStyle: { color: '#e6a23c' } }
  ];
  if (data.every((item) => item.value === 0)) {
    data = [{ value: 1, name: '無數據', itemStyle: { color: '#e4e7ed' } }];
  }
  return pieBaseOption('報到狀態', data);
};

const pieBaseOption = (seriesName, data) => ({
  tooltip: {
    trigger: 'item',
    formatter: (params) => {
      if (params.name === '無數據') return '無數據';
      return `${params.seriesName}<br/>${params.name}: ${params.value} (${params.percent}%)`;
    }
  },
  legend: {
    orient: 'vertical',
    left: '10%',
    top: 'middle',
    itemWidth: 12,
    itemHeight: 12,
    textStyle: { fontSize: 12 }
  },
  series: [
    {
      name: seriesName,
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: {
        show: true,
        position: 'outside',
        formatter: (params) => {
          if (params.name === '無數據') return '無數據';
          return `${params.name}\n${params.value}`;
        },
        fontSize: 11
      },
      emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
      labelLine: { show: true, length: 10, length2: 5 },
      data
    }
  ]
});

const getTicketRatioOption = (event, identityType) => {
  const maxAttendees = event.max_attendees || 0;
  const totalTickets = identityType === 'vip' 
    ? (event.vipTotal || 0) 
    : (event.generalTotal || 0);
  
  let data = [];
  if (maxAttendees > 0) {
    // 有上限：顯示開票數和剩餘
    // 注意：這裡的剩餘計算需要考慮該身份類別的限額
    // 但由於活動上限是總的，我們暫時用總上限減去該身份的開票數
    const remaining = Math.max(0, maxAttendees - totalTickets);
    data = [
      { value: totalTickets, name: '開票數', itemStyle: { color: '#409eff' } },
      { value: remaining, name: '剩餘', itemStyle: { color: '#e4e7ed' } }
    ];
  } else {
    // 無上限：只顯示開票數
    data = [
      { value: totalTickets, name: '開票數', itemStyle: { color: '#409eff' } }
    ];
  }
  
  if (data.every((item) => item.value === 0)) {
    data = [{ value: 1, name: '無數據', itemStyle: { color: '#e4e7ed' } }];
  }
  return pieBaseOption('票數統計', data);
};

const getCheckinStatusOption = (event, identityType) => {
  const checked = identityType === 'vip' 
    ? (event.vipChecked || 0) 
    : (event.generalChecked || 0);
  const unchecked = identityType === 'vip' 
    ? (event.vipUnchecked || 0) 
    : (event.generalUnchecked || 0);
  const pending = identityType === 'vip' 
    ? (event.vipPending || 0) 
    : (event.generalPending || 0);
  
  let data = [
    { value: checked, name: '已報到', itemStyle: { color: '#67c23a' } },
    { value: unchecked, name: '未報到', itemStyle: { color: '#f56c6c' } },
    { value: pending, name: '待審核', itemStyle: { color: '#e6a23c' } }
  ];
  
  if (data.every((item) => item.value === 0)) {
    data = [{ value: 1, name: '無數據', itemStyle: { color: '#e4e7ed' } }];
  }
  return pieBaseOption('報到狀態', data);
};
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

/* 表格標題樣式 */
:deep(.el-table th.el-table__cell) {
  background-color: #f5f7fa;
  text-align: center;
  color: #555555;
}
</style>