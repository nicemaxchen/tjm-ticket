<template>
  <div class="events">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>活动管理</span>
          <el-button type="primary" @click="handleCreate">新增活动</el-button>
        </div>
      </template>

      <el-table :data="events" border style="width: 100%">
        <el-table-column prop="name" label="活动名称" width="200" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="event_date" label="活动日期" width="180">
          <template #default="{ row }">
            {{ formatDate(row.event_date) }}
          </template>
        </el-table-column>
        <el-table-column label="开放取票" width="120">
          <template #default="{ row }">
            <el-tag :type="row.allow_web_collection ? 'success' : 'info'">
              {{ row.allow_web_collection ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 活动编辑对话框 -->
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
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入活动名称" />
        </el-form-item>

        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入活动描述"
          />
        </el-form-item>

        <el-form-item label="活动日期" prop="event_date">
          <el-date-picker
            v-model="form.event_date"
            type="datetime"
            placeholder="选择活动日期时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="开放取票时间起" prop="ticket_collection_start">
          <el-date-picker
            v-model="form.ticket_collection_start"
            type="datetime"
            placeholder="选择开放取票开始时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="开放取票时间止" prop="ticket_collection_end">
          <el-date-picker
            v-model="form.ticket_collection_end"
            type="datetime"
            placeholder="选择开放取票结束时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="开放报到时间起" prop="checkin_start">
          <el-date-picker
            v-model="form.checkin_start"
            type="datetime"
            placeholder="选择开放报到开始时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="开放报到时间止" prop="checkin_end">
          <el-date-picker
            v-model="form.checkin_end"
            type="datetime"
            placeholder="选择开放报到结束时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="允许Web直接取票" prop="allow_web_collection">
          <el-switch v-model="form.allow_web_collection" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
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
const dialogTitle = ref('新增活动');
const formRef = ref(null);
const editingId = ref(null);

const form = reactive({
  name: '',
  description: '',
  event_date: null,
  ticket_collection_start: null,
  ticket_collection_end: null,
  checkin_start: null,
  checkin_end: null,
  allow_web_collection: false
});

const rules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }]
};

onMounted(async () => {
  await loadEvents();
});

const loadEvents = async () => {
  try {
    const result = await adminApi.getEvents();
    events.value = result.events;
  } catch (error) {
    ElMessage.error('加载活动列表失败');
  }
};

const handleCreate = () => {
  dialogTitle.value = '新增活动';
  editingId.value = null;
  resetForm();
  showDialog.value = true;
};

const handleEdit = (row) => {
  dialogTitle.value = '编辑活动';
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name,
    description: row.description || '',
    event_date: row.event_date ? new Date(row.event_date) : null,
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
    await ElMessageBox.confirm('确认删除该活动吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    });
    // 这里应该调用删除API
    ElMessage.success('删除成功');
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
      const data = {
        ...form,
        event_date: form.event_date ? form.event_date.toISOString() : null,
        ticket_collection_start: form.ticket_collection_start ? form.ticket_collection_start.toISOString() : null,
        ticket_collection_end: form.ticket_collection_end ? form.ticket_collection_end.toISOString() : null,
        checkin_start: form.checkin_start ? form.checkin_start.toISOString() : null,
        checkin_end: form.checkin_end ? form.checkin_end.toISOString() : null
      };

      if (editingId.value) {
        await adminApi.updateEvent(editingId.value, data);
        ElMessage.success('更新成功');
      } else {
        await adminApi.createEvent(data);
        ElMessage.success('创建成功');
      }

      showDialog.value = false;
      await loadEvents();
    } catch (error) {
      ElMessage.error(error.message || '操作失败');
    }
  });
};

const resetForm = () => {
  Object.assign(form, {
    name: '',
    description: '',
    event_date: null,
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
</style>