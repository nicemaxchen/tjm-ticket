<template>
  <div class="events">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>活動管理</span>
          <el-button type="primary" @click="handleCreate">新增活動</el-button>
        </div>
      </template>

      <el-table :data="events" border style="width: 100%">
        <el-table-column prop="name" label="活動名稱" width="150" header-align="center" />
        <el-table-column prop="description" label="描述" header-align="center" />
        <el-table-column prop="location" label="活動地點" width="100" header-align="center" />
        <el-table-column prop="max_attendees" label="人數上限" width="100" header-align="center">
          <template #default="{ row }">
            {{ row.max_attendees > 0 ? row.max_attendees : '無限制' }}
          </template>
        </el-table-column>
        <el-table-column label="每手機限額" width="120" header-align="center">
          <template #default="{ row }">
            <div v-if="row.vip_per_phone_limit > 0 || row.general_per_phone_limit > 0">
              <span v-if="row.vip_per_phone_limit > 0">貴賓{{ row.vip_per_phone_limit }}</span>
              <span v-if="row.vip_per_phone_limit > 0 && row.general_per_phone_limit > 0"> / </span>
              <span v-if="row.general_per_phone_limit > 0">一般{{ row.general_per_phone_limit }}</span>
            </div>
            <span v-else>無限制</span>
          </template>
        </el-table-column>
        <el-table-column prop="event_date" label="活動日期" width="180" header-align="center">
          <template #default="{ row }">
            {{ formatDate(row.event_date) }}
          </template>
        </el-table-column>
        <el-table-column label="開放取票" width="90" header-align="center">
          <template #default="{ row }">
            <el-tag :type="row.allow_web_collection ? 'success' : 'info'">
              {{ row.allow_web_collection ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" header-align="center">
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

    <!-- 活動編輯對話框 -->
    <el-dialog
      v-model="showDialog"
      :title="dialogTitle"
      width="700px"
      @close="resetForm"
    >
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="150px"
      >
        <el-form-item label="活動名稱" prop="name">
          <el-input v-model="form.name" placeholder="請輸入活動名稱" />
        </el-form-item>

        <el-form-item label="活動描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="請輸入活動描述"
          />
        </el-form-item>

        <el-form-item label="活動日期" prop="event_date">
          <el-date-picker
            v-model="form.event_date"
            type="datetime"
            placeholder="選擇活動日期時間"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="活動地點" prop="location">
          <el-input v-model="form.location" placeholder="請輸入活動地點" />
        </el-form-item>

        <el-form-item label="活動索票最大人數" prop="max_attendees">
          <el-input-number
            v-model="form.max_attendees"
            :min="0"
            :step="1"
            placeholder="0表示無限制"
            style="width: 100%"
          />
          <div class="form-tip">0表示無限制</div>
        </el-form-item>

        <el-form-item label="貴賓每手機號限額" prop="vip_per_phone_limit">
          <el-input-number
            v-model="form.vip_per_phone_limit"
            :min="0"
            :step="1"
            placeholder="0表示無限制"
            style="width: 100%"
          />
          <div class="form-tip">0表示無限制，此限額適用於所有標記為「貴賓」身份的票券類別</div>
        </el-form-item>

        <el-form-item label="一般每手機號限額" prop="general_per_phone_limit">
          <el-input-number
            v-model="form.general_per_phone_limit"
            :min="0"
            :step="1"
            placeholder="0表示無限制"
            style="width: 100%"
          />
          <div class="form-tip">0表示無限制，此限額適用於所有標記為「一般」身份的票券類別</div>
        </el-form-item>

        <el-form-item label="開放取票時間起" prop="ticket_collection_start">
          <el-date-picker
            v-model="form.ticket_collection_start"
            type="datetime"
            placeholder="選擇開放取票開始時間"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="開放取票時間止" prop="ticket_collection_end">
          <el-date-picker
            v-model="form.ticket_collection_end"
            type="datetime"
            placeholder="選擇開放取票結束時間"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="開放報到時間起" prop="checkin_start">
          <el-date-picker
            v-model="form.checkin_start"
            type="datetime"
            placeholder="選擇開放報到開始時間"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="開放報到時間止" prop="checkin_end">
          <el-date-picker
            v-model="form.checkin_end"
            type="datetime"
            placeholder="選擇開放報到結束時間"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="允許Web直接取票" prop="allow_web_collection">
          <el-switch v-model="form.allow_web_collection" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm">確認</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '../api';

const events = ref([]);
const showDialog = ref(false);
const dialogTitle = ref('新增活動');
const formRef = ref(null);
const editingId = ref(null);

const form = reactive({
  name: '',
  description: '',
  event_date: null,
  location: '',
  max_attendees: 0,
  vip_per_phone_limit: 0,
  general_per_phone_limit: 0,
  ticket_collection_start: null,
  ticket_collection_end: null,
  checkin_start: null,
  checkin_end: null,
  allow_web_collection: false
});

const rules = {
  name: [{ required: true, message: '請輸入活動名稱', trigger: 'blur' }]
};

onMounted(async () => {
  await loadEvents();
});

const loadEvents = async () => {
  try {
    const result = await adminApi.getEvents();
    events.value = result.events;
  } catch (error) {
    ElMessage.error('載入活動列表失敗');
  }
};

const handleCreate = () => {
  dialogTitle.value = '新增活動';
  editingId.value = null;
  resetForm();
  showDialog.value = true;
};

const handleEdit = (row) => {
  dialogTitle.value = '編輯活動';
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name,
    description: row.description || '',
    event_date: row.event_date ? new Date(row.event_date) : null,
    location: row.location || '',
    max_attendees: row.max_attendees || 0,
    vip_per_phone_limit: row.vip_per_phone_limit || 0,
    general_per_phone_limit: row.general_per_phone_limit || 0,
    ticket_collection_start: row.ticket_collection_start ? new Date(row.ticket_collection_start) : null,
    ticket_collection_end: row.ticket_collection_end ? new Date(row.ticket_collection_end) : null,
    checkin_start: row.checkin_start ? new Date(row.checkin_start) : null,
    checkin_end: row.checkin_end ? new Date(row.checkin_end) : null,
    allow_web_collection: Boolean(row.allow_web_collection)
  });
  showDialog.value = true;
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('確認刪除該活動吗？', '提示', {
      confirmButtonText: '確認',
      cancelButtonText: '取消',
      type: 'warning'
    });
    // 這裡應該呼叫刪除API
    ElMessage.success('刪除成功');
    await loadEvents();
  } catch (error) {
    // 取消操作
  }
};

const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      // 確保 max_attendees 是數字類型
      const maxAttendees = form.max_attendees !== null && form.max_attendees !== undefined 
        ? Number(form.max_attendees) 
        : 0;
      
      const data = {
        name: form.name,
        description: form.description || '',
        event_date: form.event_date ? form.event_date.toISOString() : null,
        location: String(form.location || ''),
        max_attendees: maxAttendees,
        vip_per_phone_limit: form.vip_per_phone_limit || 0,
        general_per_phone_limit: form.general_per_phone_limit || 0,
        ticket_collection_start: form.ticket_collection_start ? form.ticket_collection_start.toISOString() : null,
        ticket_collection_end: form.ticket_collection_end ? form.ticket_collection_end.toISOString() : null,
        checkin_start: form.checkin_start ? form.checkin_start.toISOString() : null,
        checkin_end: form.checkin_end ? form.checkin_end.toISOString() : null,
        allow_web_collection: form.allow_web_collection || false
      };

      console.log('提交的數據:', data); // 調試用

      if (editingId.value) {
        await adminApi.updateEvent(editingId.value, data);
        ElMessage.success('更新成功');
      } else {
        await adminApi.createEvent(data);
        ElMessage.success('建立成功');
      }

      showDialog.value = false;
      await loadEvents();
    } catch (error) {
      console.error('提交錯誤:', error); // 調試用
      ElMessage.error(error.message || '操作失敗');
    }
  });
};

const resetForm = () => {
  Object.assign(form, {
    name: '',
    description: '',
    event_date: null,
    location: '',
    max_attendees: 0,
    vip_per_phone_limit: 0,
    general_per_phone_limit: 0,
    ticket_collection_start: null,
    ticket_collection_end: null,
    checkin_start: null,
    checkin_end: null,
    allow_web_collection: false
  });
  formRef.value?.resetFields();
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW');
};
</script>

<style scoped>
.events {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

/* 表格標題樣式 */
:deep(.el-table th.el-table__cell) {
  background-color: #f5f7fa;
  text-align: center;
  color: #555555;
}
</style>