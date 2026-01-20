<template>
  <div class="pending-list">
    <el-card>
      <template #header>
        <span>待审核名单</span>
      </template>

      <el-table :data="pendingList" border style="width: 100%">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="Email" width="200" />
        <el-table-column prop="event_name" label="活动" width="200" />
        <el-table-column prop="category_name" label="票券类别" width="150" />
        <el-table-column prop="created_at" label="申请时间" width="180">
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
              审核通过
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="showApproveDialog"
      title="审核通过"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="备注">
          <el-input
            v-model="approveForm.notes"
            type="textarea"
            :rows="3"
            placeholder="可选：填写审核备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApproveDialog = false">取消</el-button>
        <el-button type="success" @click="submitApprove">确认通过</el-button>
      </template>
    </el-dialog>

    <!-- 拒绝对话框 -->
    <el-dialog
      v-model="showRejectDialog"
      title="审核拒绝"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="拒绝原因">
          <el-input
            v-model="rejectForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请填写拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="submitReject">确认拒绝</el-button>
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
    ElMessage.error('加载待审核名单失败');
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

    ElMessage.success('审核通过，票券已生成');
    showApproveDialog.value = false;
    await loadPendingList();
  } catch (error) {
    ElMessage.error(error.message || '操作失败');
  }
};

const submitReject = async () => {
  if (!rejectForm.notes) {
    ElMessage.warning('请填写拒绝原因');
    return;
  }

  try {
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    await adminApi.rejectPending(currentId.value, {
      admin_id: adminInfo.id,
      admin_notes: rejectForm.notes
    });

    ElMessage.success('已拒绝该申请');
    showRejectDialog.value = false;
    await loadPendingList();
  } catch (error) {
    ElMessage.error(error.message || '操作失败');
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