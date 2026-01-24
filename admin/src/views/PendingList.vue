<template>
  <div class="pending-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>待審核名單</span>
          <div class="header-filters">
            <el-select
              v-model="filterEvent"
              placeholder="活動"
              clearable
              style="width: 200px; margin-left: 8px;"
            >
              <el-option
                v-for="e in uniqueEvents"
                :key="e"
                :label="e"
                :value="e"
              />
            </el-select>
            <el-select
              v-model="filterCategory"
              placeholder="票券類別"
              clearable
              style="width: 160px; margin-left: 8px;"
            >
              <el-option
                v-for="c in uniqueCategories"
                :key="c"
                :label="c"
                :value="c"
              />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="filteredPendingList" border style="width: 100%">
        <el-table-column prop="event_name" label="活動" width="160" header-align="center" sortable />
        <el-table-column prop="name" label="姓名" width="100" header-align="center" sortable />
        <el-table-column prop="category_name" label="票券類別" width="120" header-align="center" sortable />
        <el-table-column prop="phone" label="手機號" width="130" header-align="center" sortable />
        <el-table-column label="同手機申請數" width="140" header-align="center">
          <template #default="{ row }">
            <span v-if="phoneCounts[row.phone]">
              已申請{{ phoneCounts[row.phone].approved }} / 審查中{{ phoneCounts[row.phone].pending }}
            </span>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="Email" header-align="center" sortable />
        
        <el-table-column prop="created_at" label="申請時間" width="180" header-align="center" sortable>
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" header-align="center">
          <template #default="{ row }">
            <el-button
              type="success"
              size="small"
              @click="handleApprove(row)"
            >
              審核通過
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleReject(row)"
            >
              拒絕
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 審核对话框 -->
    <el-dialog
      v-model="showApproveDialog"
      title="審核通過"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="備註">
          <el-input
            v-model="approveForm.notes"
            type="textarea"
            :rows="3"
            placeholder="可選：填寫審核備註"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApproveDialog = false">取消</el-button>
        <el-button type="success" @click="submitApprove">確認通過</el-button>
      </template>
    </el-dialog>

    <!-- 拒絕对话框 -->
    <el-dialog
      v-model="showRejectDialog"
      title="審核拒絕"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="拒絕原因">
          <el-input
            v-model="rejectForm.notes"
            type="textarea"
            :rows="3"
            placeholder="請填寫拒絕原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="submitReject">確認拒絕</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '../api';

const pendingList = ref([]);
const phoneCounts = ref({});
const filterEvent = ref('');
const filterCategory = ref('');
const showApproveDialog = ref(false);
const showRejectDialog = ref(false);
const currentId = ref(null);

const uniqueEvents = computed(() => {
  const set = new Set();
  pendingList.value.forEach((r) => {
    if (r.event_name) set.add(r.event_name);
  });
  return [...set].sort();
});

const uniqueCategories = computed(() => {
  const set = new Set();
  pendingList.value.forEach((r) => {
    if (r.category_name) set.add(r.category_name);
  });
  return [...set].sort();
});

const filteredPendingList = computed(() => {
  let list = pendingList.value;
  if (filterEvent.value) {
    list = list.filter((r) => r.event_name === filterEvent.value);
  }
  if (filterCategory.value) {
    list = list.filter((r) => r.category_name === filterCategory.value);
  }
  return list;
});

const approveForm = reactive({
  notes: ''
});

const rejectForm = reactive({
  notes: ''
});

onMounted(async () => {
  await loadPendingList();
});

const loadPendingList = async () => {
  try {
    const [pendingResult, countsResult] = await Promise.all([
      adminApi.getPendingList(),
      adminApi.getPhoneCounts()
    ]);
    pendingList.value = pendingResult.pendingList.filter(item => item.status === 'pending');
    phoneCounts.value = countsResult.phoneCounts || {};
  } catch (error) {
    ElMessage.error('載入待審核名單失敗');
  }
};

const handleApprove = (row) => {
  currentId.value = row.id;
  approveForm.notes = '';
  showApproveDialog.value = true;
};

const handleReject = (row) => {
  currentId.value = row.id;
  rejectForm.notes = '';
  showRejectDialog.value = true;
};

const submitApprove = async () => {
  try {
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    await adminApi.approvePending(currentId.value, {
      admin_id: adminInfo.id,
      admin_notes: approveForm.notes
    });

    ElMessage.success('審核通過，票券已產生');
    showApproveDialog.value = false;
    await loadPendingList();
  } catch (error) {
    ElMessage.error(error.message || '操作失敗');
  }
};

const submitReject = async () => {
  if (!rejectForm.notes) {
    ElMessage.warning('請填寫拒絕原因');
    return;
  }

  try {
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    await adminApi.rejectPending(currentId.value, {
      admin_id: adminInfo.id,
      admin_notes: rejectForm.notes
    });

    ElMessage.success('已拒絕該申請');
    showRejectDialog.value = false;
    await loadPendingList();
  } catch (error) {
    ElMessage.error(error.message || '操作失敗');
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW');
};
</script>

<style scoped>
.pending-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-filters {
  display: flex;
  align-items: center;
}

/* 表格標題樣式 */
:deep(.el-table th.el-table__cell) {
  background-color: #f5f7fa;
  text-align: center;
  color: #555555;
}
</style>