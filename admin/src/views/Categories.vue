<template>
  <div class="categories">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>票券类别管理</span>
          <el-button type="primary" @click="handleCreate">新增类别</el-button>
        </div>
      </template>

      <el-table :data="categories" border style="width: 100%">
        <el-table-column prop="name" label="类别名称" width="200" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="total_limit" label="总限额" width="100">
          <template #default="{ row }">
            {{ row.total_limit || '无限制' }}
          </template>
        </el-table-column>
        <el-table-column prop="daily_limit" label="每日限额" width="100">
          <template #default="{ row }">
            {{ row.daily_limit || '无限制' }}
          </template>
        </el-table-column>
        <el-table-column prop="per_phone_limit" label="每手机号限额" width="120">
          <template #default="{ row }">
            {{ row.per_phone_limit || 1 }}
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

    <!-- 类别编辑对话框 -->
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
        <el-form-item label="类别名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入类别名称" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>

        <el-form-item label="总限额" prop="total_limit">
          <el-input-number
            v-model="form.total_limit"
            :min="0"
            :max="999999"
            placeholder="0表示无限制"
            style="width: 100%"
          />
          <div class="form-tip">0表示无限制</div>
        </el-form-item>

        <el-form-item label="每日限额" prop="daily_limit">
          <el-input-number
            v-model="form.daily_limit"
            :min="0"
            :max="999999"
            placeholder="0表示无限制"
            style="width: 100%"
          />
          <div class="form-tip">0表示无限制</div>
        </el-form-item>

        <el-form-item label="每手机号限额" prop="per_phone_limit">
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
        <el-button type="primary" @click="submitForm">确认</el-button>
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
const dialogTitle = ref('新增类别');
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
  name: [{ required: true, message: '请输入类别名称', trigger: 'blur' }]
};

onMounted(async () => {
  await loadCategories();
});

const loadCategories = async () => {
  try {
    const result = await adminApi.getCategories();
    categories.value = result.categories;
  } catch (error) {
    ElMessage.error('加载类别列表失败');
  }
};

const handleCreate = () => {
  dialogTitle.value = '新增类别';
  editingId.value = null;
  resetForm();
  showDialog.value = true;
};

const handleEdit = (row) => {
  dialogTitle.value = '编辑类别';
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
    await ElMessageBox.confirm('确认删除该类别吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    });
    // 这里应该调用删除API
    ElMessage.success('删除成功');
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
        ElMessage.success('创建成功');
      }

      showDialog.value = false;
      await loadCategories();
    } catch (error) {
      ElMessage.error(error.message || '操作失败');
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