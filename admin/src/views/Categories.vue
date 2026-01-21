<template>
  <div class="categories">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>票券類別管理</span>
          <el-button type="primary" @click="handleCreate">新增類別</el-button>
        </div>
      </template>

      <el-table :data="categories" border style="width: 100%">
        <el-table-column prop="name" label="類別名稱" width="200" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="total_limit" label="總限額" width="100">
          <template #default="{ row }">
            {{ row.total_limit || '無限制' }}
          </template>
        </el-table-column>
        <el-table-column prop="daily_limit" label="每日限額" width="100">
          <template #default="{ row }">
            {{ row.daily_limit || '無限制' }}
          </template>
        </el-table-column>
        <el-table-column prop="per_phone_limit" label="每手機號限額" width="120">
          <template #default="{ row }">
            {{ row.per_phone_limit || 1 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
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

    <!-- 類別編輯對話框 -->
    <el-dialog
      v-model="showDialog"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="150px"
      >
        <el-form-item label="類別名稱" prop="name">
          <el-input v-model="form.name" placeholder="請輸入類別名稱" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="請輸入描述"
          />
        </el-form-item>

        <el-form-item label="總限額" prop="total_limit">
          <el-input-number
            v-model="form.total_limit"
            :min="0"
            :max="999999"
            placeholder="0表示無限制"
            style="width: 100%"
          />
          <div class="form-tip">0表示無限制</div>
        </el-form-item>

        <el-form-item label="每日限額" prop="daily_limit">
          <el-input-number
            v-model="form.daily_limit"
            :min="0"
            :max="999999"
            placeholder="0表示無限制"
            style="width: 100%"
          />
          <div class="form-tip">0表示無限制</div>
        </el-form-item>

        <el-form-item label="每手機號限額" prop="per_phone_limit">
          <el-input-number
            v-model="form.per_phone_limit"
            :min="1"
            :max="10"
            style="width: 100%"
          />
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

const categories = ref([]);
const showDialog = ref(false);
const dialogTitle = ref('新增類別');
const formRef = ref(null);
const editingId = ref(null);

const form = reactive({
  name: '',
  description: '',
  total_limit: 0,
  daily_limit: 0,
  per_phone_limit: 1
});

const rules = {
  name: [{ required: true, message: '請輸入類別名稱', trigger: 'blur' }]
};

onMounted(async () => {
  await loadCategories();
});

const loadCategories = async () => {
  try {
    const result = await adminApi.getCategories();
    categories.value = result.categories;
  } catch (error) {
    ElMessage.error('載入類別列表失敗');
  }
};

const handleCreate = () => {
  dialogTitle.value = '新增類別';
  editingId.value = null;
  resetForm();
  showDialog.value = true;
};

const handleEdit = (row) => {
  dialogTitle.value = '編輯類別';
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name,
    description: row.description || '',
    total_limit: row.total_limit || 0,
    daily_limit: row.daily_limit || 0,
    per_phone_limit: row.per_phone_limit || 1
  });
  showDialog.value = true;
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('確認刪除該類別吗？', '提示', {
      confirmButtonText: '確認',
      cancelButtonText: '取消',
      type: 'warning'
    });
    // 這裡應該呼叫刪除API
    ElMessage.success('刪除成功');
    await loadCategories();
  } catch (error) {
    // 取消操作
  }
};

const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      if (editingId.value) {
        await adminApi.updateCategory(editingId.value, form);
        ElMessage.success('更新成功');
      } else {
        await adminApi.createCategory(form);
        ElMessage.success('建立成功');
      }

      showDialog.value = false;
      await loadCategories();
    } catch (error) {
      ElMessage.error(error.message || '操作失敗');
    }
  });
};

const resetForm = () => {
  Object.assign(form, {
    name: '',
    description: '',
    total_limit: 0,
    daily_limit: 0,
    per_phone_limit: 1
  });
  formRef.value?.resetFields();
};
</script>

<style scoped>
.categories {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}
</style>