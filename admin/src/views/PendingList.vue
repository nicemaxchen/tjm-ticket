<template>
  <div class="pending-list">
    <el-card>
      <template #header>
        <span>待審核名單</span>
      </template>

      <el-table :data="pendingList" border style="width: 100%">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="手機號" width="130" />
        <el-table-column prop="email" label="Email" width="200" />
        <el-table-column prop="event_name" label="活動" width="200" />
        <el-table-column prop="category_name" label="票券類別" width="150" />
        <el-table-column prop="created_at" label="申請時間" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
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
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '../api';

const pendingList = ref([]);
const showApproveDialog = ref(false);
const showRejectDialog = ref(false);
const currentId = ref(null);

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
    const result = await adminApi.getPendingList();
    pendingList.value = result.pendingList.filter(item => item.status === 'pending');
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
</style>