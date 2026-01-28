<template>
  <div class="statistics">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>報名詳情</span>
            <el-select
              v-model="selectedEventId"
              placeholder="選擇活動"
              style="width: 300px; margin-left: 20px;"
              @change="handleEventChange"
            >
              <el-option
                v-for="event in events"
                :key="event.id"
                :label="event.name"
                :value="event.id"
              />
            </el-select>
          </div>
          <div class="header-center" v-if="selectedEventName">
            <h2 class="event-title">{{ selectedEventName }}</h2>
          </div>
          <div class="header-right header-filters">
            <el-select
              v-model="filterCategoryDetail"
              placeholder="票券類別"
              clearable
              style="width: 140px; margin-left: 8px;"
            >
              <el-option
                v-for="c in uniqueCategoriesTickets"
                :key="c"
                :label="c"
                :value="c"
              />
            </el-select>
            <el-select
              v-model="filterCheckinStatus"
              placeholder="報到狀態"
              clearable
              style="width: 120px; margin-left: 8px;"
            >
              <el-option label="已報到" value="checked" />
              <el-option label="未報到" value="unchecked" />
            </el-select>
          </div>
  </div>

  <!-- 票券編輯對話框 -->
  <el-dialog
    v-model="showEditDialog"
    title="編輯票券"
    width="500px"
  >
    <el-form label-width="100px">
      <el-form-item label="票券類別">
        <el-select
          v-model="editForm.ticket_category_id"
          placeholder="選擇票券類別"
          style="width: 100%;"
        >
          <el-option
            v-for="cat in editCategories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="報到狀態">
        <el-radio-group v-model="editForm.checkin_status">
          <el-radio label="unchecked">未報到</el-radio>
          <el-radio label="checked">已報到</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="審查狀態">
        <el-radio-group v-model="editForm.review_status">
          <el-radio label="confirmed">審核通過</el-radio>
          <el-radio label="pending">審查中</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showEditDialog = false">取消</el-button>
      <el-button type="primary" :loading="editLoading" @click="submitEdit">
        儲存
      </el-button>
    </template>
  </el-dialog>
      </template>

      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="5">
          <el-statistic title="票數上限" :value="statistics.max_attendees > 0 ? statistics.max_attendees : '無限制'">
            <template #suffix>
              <span>{{ statistics.max_attendees > 0 ? '人' : '' }}</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="5">
          <el-statistic title="總票券數" :value="statistics.total">
            <template #suffix>
              <span>張</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="5">
          <el-statistic title="已報到" :value="statistics.checked">
            <template #suffix>
              <span>張</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="5">
          <el-statistic title="未報到" :value="statistics.unchecked">
            <template #suffix>
              <span>張</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="4">
          <el-statistic title="待審核" :value="statistics.pendingCount">
            <template #suffix>
              <span>條</span>
            </template>
          </el-statistic>
        </el-col>
      </el-row>

      <el-table :data="filteredTickets" border style="width: 100%">
        <el-table-column prop="user_name" label="姓名" width="120" header-align="center" sortable>
          <template #default="{ row }">
            {{ row.user_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="organization_title" label="單位與職稱" width="180" header-align="center">
          <template #default="{ row }">
            {{ row.organization_title || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="category_name" label="票券類別" width="120" header-align="center" sortable />
        <el-table-column prop="phone" label="手機號" width="130" header-align="center" sortable />
        <!-- <el-table-column label="同手機申請數" width="140" header-align="center">
          <template #default="{ row }">
            <span v-if="phoneCounts[row.phone]">
              已申請{{ phoneCounts[row.phone].approved }} / 審查中{{ phoneCounts[row.phone].pending }}
            </span>
            <span v-else>—</span>
          </template>
        </el-table-column> -->
        <el-table-column prop="email" label="Email" width="160" header-align="center" sortable>
          <template #default="{ row }">
            {{ row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="registration_time" label="報名時間" width="180" header-align="center" sortable>
          <template #default="{ row }">
            {{ formatDate(row.registration_time || row.created_at) }}
          </template>
        </el-table-column>        
        <el-table-column prop="checkin_status" label="報到狀態" width="120" header-align="center" sortable>
          <template #default="{ row }">
            <el-tag :type="row.checkin_status === 'checked' ? 'success' : 'info'">
              {{ row.checkin_status === 'checked' ? '已報到' : '未報到' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="checkin_time" label="報到時間" width="180" header-align="center" sortable>
          <template #default="{ row }">
            {{ row.checkin_time ? formatDate(row.checkin_time) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" header-align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              編輯
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              刪除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 待審查列表 -->
    <el-card style="margin-top: 20px;" v-if="selectedEventId">
      <template #header>
        <div class="pending-header">
          <span>待審查列表</span>
          <el-select
            v-model="filterCategoryPending"
            placeholder="票券類別"
            clearable
            style="width: 160px;"
          >
            <el-option
              v-for="c in uniqueCategoriesPending"
              :key="c"
              :label="c"
              :value="c"
            />
          </el-select>
        </div>
      </template>
      <el-table :data="filteredPendingList" border style="width: 100%">
        <el-table-column prop="name" label="姓名" width="120" header-align="center" sortable />
        <el-table-column prop="organization_title" label="單位與職稱" width="180" header-align="center" />
        <el-table-column prop="category_name" label="票券類別" width="150" header-align="center" sortable />
        <el-table-column prop="phone" label="手機號" width="130" header-align="center" sortable />
        <el-table-column label="同手機申請數" width="160" header-align="center">
          <template #default="{ row }">
            <span v-if="phoneCounts[row.phone]">
              已申請{{ phoneCounts[row.phone].approved }} / 審查中{{ phoneCounts[row.phone].pending }}
            </span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="Email" header-align="center" sortable />
        <el-table-column prop="created_at" label="報名時間" width="180" header-align="center" sortable>
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right" header-align="center">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleApprove(row)">
              審核通過
            </el-button>
            <el-button type="danger" size="small" @click="handleReject(row)">
              拒絕
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '../api';

const route = useRoute();
const router = useRouter();
const events = ref([]);
const selectedEventId = ref(null); // Firestore event id (string)
const selectedEventName = ref('');
const statistics = reactive({
  total: 0,
  checked: 0,
  unchecked: 0,
  max_attendees: 0,
  pendingCount: 0
});
const tickets = ref([]);
const pendingList = ref([]);
const filterCategoryDetail = ref('');
const filterCheckinStatus = ref('');
const filterCategoryPending = ref('');
const showEditDialog = ref(false);
const editLoading = ref(false);
const editCategories = ref([]);
const editingTicket = ref(null);
const editForm = reactive({
  ticket_category_id: '',
  checkin_status: 'unchecked',
  review_status: 'confirmed'
});

const uniqueCategoriesTickets = computed(() => {
  const set = new Set();
  tickets.value.forEach((r) => {
    if (r.category_name) set.add(r.category_name);
  });
  return [...set].sort();
});

const uniqueCategoriesPending = computed(() => {
  const set = new Set();
  pendingList.value.forEach((r) => {
    if (r.category_name) set.add(r.category_name);
  });
  return [...set].sort();
});

const filteredTickets = computed(() => {
  // 已開票列表不顯示審查中的報名
  let list = tickets.value.filter((r) => r.registration_status !== 'pending');
  if (filterCategoryDetail.value) {
    list = list.filter((r) => r.category_name === filterCategoryDetail.value);
  }
  if (filterCheckinStatus.value) {
    list = list.filter((r) => r.checkin_status === filterCheckinStatus.value);
  }
  return list;
});

const filteredPendingList = computed(() => {
  let list = pendingList.value;
  if (filterCategoryPending.value) {
    list = list.filter((r) => r.category_name === filterCategoryPending.value);
  }
  return list;
});

const phoneCounts = computed(() => {
  const map = {};
  const add = (phone, key) => {
    if (!phone) return;
    if (!map[phone]) map[phone] = { approved: 0, pending: 0 };
    map[phone][key]++;
  };
  tickets.value.forEach((row) => add(row.phone, 'approved'));
  pendingList.value.forEach((row) => add(row.phone, 'pending'));
  return map;
});

onMounted(async () => {
  // 先載入活動列表
  await loadEvents();
  
  // 從 URL 參數中獲取 eventId
  const eventIdFromQuery = route.query.eventId;
  if (eventIdFromQuery) {
    selectedEventId.value = String(eventIdFromQuery);
  } else if (events.value.length > 0) {
    // 如果沒有指定活動，預設選擇第一個活動
    selectedEventId.value = String(events.value[0].id);
    router.replace({
      path: '/statistics',
      query: { eventId: events.value[0].id.toString() }
    });
  }
  
  updateSelectedEventName();
  await loadStatistics();
});

// 更新選中的活動名稱
const updateSelectedEventName = () => {
  if (selectedEventId.value) {
    const event = events.value.find(e => String(e.id) === String(selectedEventId.value));
    selectedEventName.value = event ? event.name : '';
  } else {
    selectedEventName.value = '';
  }
};

// 監聽路由變化，當 eventId 改變時重新載入統計
watch(() => route.query.eventId, (newEventId) => {
  if (newEventId) {
    const eventId = String(newEventId);
    if (selectedEventId.value !== eventId) {
      selectedEventId.value = eventId;
      updateSelectedEventName();
      loadStatistics();
    }
  } else if (selectedEventId.value !== null) {
    selectedEventId.value = null;
    selectedEventName.value = '';
    loadStatistics();
  }
});

// 監聽活動列表變化
watch(() => events.value, () => {
  updateSelectedEventName();
}, { deep: true });

const loadEvents = async () => {
  try {
    const result = await adminApi.getEvents();
    events.value = result.events;
  } catch (error) {
    console.error('載入活動列表失敗:', error);
  }
};

const handleEventChange = () => {
  // 更新活動名稱
  updateSelectedEventName();
  // 切換活動時重置過濾器
  filterCategoryDetail.value = '';
  filterCheckinStatus.value = '';
  filterCategoryPending.value = '';
  // 當選擇活動改變時，更新 URL 參數
  if (selectedEventId.value) {
    router.replace({
      path: '/statistics',
      query: { eventId: String(selectedEventId.value) }
    });
    // 先清空列表，避免显示旧数据
    pendingList.value = [];
    loadStatistics();
  } else {
    // 如果没有选择活动，清空列表
    pendingList.value = [];
  }
};

const loadStatistics = async () => {
  try {
    const result = await adminApi.getStatistics(selectedEventId.value);
    statistics.total = result.statistics.total || 0;
    statistics.checked = result.statistics.checked || 0;
    statistics.unchecked = result.statistics.unchecked || 0;
    statistics.max_attendees = result.statistics.max_attendees || 0;
    statistics.pendingCount = result.statistics.pendingCount || 0;
    tickets.value = result.tickets || [];
    
    // 載入待審查列表
    if (selectedEventId.value) {
      await loadPendingList();
    } else {
      pendingList.value = [];
    }
  } catch (error) {
    console.error('載入統計資訊失敗:', error);
  }
};

const loadPendingList = async () => {
  if (!selectedEventId.value) {
    pendingList.value = [];
    return;
  }
  
  try {
    const result = await adminApi.getPendingList(selectedEventId.value);
    pendingList.value = result.pendingList || [];
    console.log('載入待審查列表，活動ID:', selectedEventId.value, '記錄數:', pendingList.value.length);
  } catch (error) {
    console.error('載入待審查列表失敗:', error);
    pendingList.value = [];
  }
};

const handleEdit = async (row) => {
  editingTicket.value = row;
  editForm.ticket_category_id = row.ticket_category_id || '';
  editForm.checkin_status = row.checkin_status || 'unchecked';
  editForm.review_status = row.registration_status || 'confirmed';
  showEditDialog.value = true;

  try {
    const res = await adminApi.getCategories(selectedEventId.value);
    editCategories.value = res.categories || [];
  } catch (error) {
    console.error('載入類別失敗:', error);
    editCategories.value = [];
  }
};

const submitEdit = async () => {
  if (!editingTicket.value) return;
  editLoading.value = true;
  try {
    await adminApi.updateTicket(editingTicket.value.id, {
      ticket_category_id: editForm.ticket_category_id || undefined,
      checkin_status: editForm.checkin_status,
      review_status: editForm.review_status
    });
    ElMessage.success('票券已更新');
    showEditDialog.value = false;
    await loadStatistics();
  } catch (error) {
    ElMessage.error(error.message || '更新失敗');
  } finally {
    editLoading.value = false;
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('確認刪除該票券嗎？', '提示', {
      confirmButtonText: '確認',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await adminApi.deleteTicket(row.id);
    ElMessage.success('刪除成功');
    await loadStatistics();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '刪除失敗');
    }
  }
};

const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm('確認審核通過該報名嗎？', '提示', {
      confirmButtonText: '確認',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await adminApi.approvePending(row.id, {});
    ElMessage.success('審核通過成功');
    await loadPendingList();
    await loadStatistics();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '審核失敗');
    }
  }
};

const handleReject = async (row) => {
  try {
    await ElMessageBox.confirm('確認拒絕該報名嗎？', '提示', {
      confirmButtonText: '確認',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await adminApi.rejectPending(row.id, {});
    ElMessage.success('已拒絕該報名');
    await loadPendingList();
    await loadStatistics();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失敗');
    }
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
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 280px;
}

.header-filters {
  gap: 0;
}

.pending-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-title {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  text-align: center;
}

/* 表格標題樣式 */
:deep(.el-table th.el-table__cell) {
  background-color: #f5f7fa;
  text-align: center;
  color: #555555;
}
</style>