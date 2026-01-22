<template>
  <div class="categories">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>票券類別管理</span>
          <el-button type="primary" @click="handleCreate">新增類別</el-button>
        </div>
      </template>

      <!-- 活動選擇器 -->
      <div class="filter-section">
        <el-select
          v-model="selectedEventId"
          placeholder="請選擇活動"
          clearable
          @change="handleEventChange"
          style="width: 300px; margin-bottom: 20px;"
        >
          <el-option
            v-for="event in events"
            :key="event.id"
            :label="event.name"
            :value="event.id"
          />
        </el-select>
        
        <!-- 活動票數上限資訊 -->
        <div v-if="selectedEvent && selectedEvent.max_attendees > 0" class="event-limit-info">
          <el-alert
            :title="`活動票數上限: ${selectedEvent.max_attendees} 張`"
            :type="totalLimitSum > selectedEvent.max_attendees ? 'error' : (totalLimitSum === selectedEvent.max_attendees ? 'warning' : 'success')"
            :closable="false"
            style="margin-bottom: 20px;"
          >
            <template #default>
              <div>
                <div>活動票數上限: <strong>{{ selectedEvent.max_attendees }}</strong> 張</div>
                <div>所有類別總限額: <strong>{{ totalLimitSum }}</strong> 張</div>
                <div v-if="totalLimitSum > selectedEvent.max_attendees" style="color: #f56c6c; margin-top: 5px;">
                  ⚠️ 總限額超過活動上限，請調整類別限額
                </div>
                <div v-else-if="totalLimitSum === selectedEvent.max_attendees" style="color: #e6a23c; margin-top: 5px;">
                  ✓ 總限額已達活動上限
                </div>
                <div v-else style="color: #67c23a; margin-top: 5px;">
                  ✓ 還可分配 {{ selectedEvent.max_attendees - totalLimitSum }} 張
                </div>
              </div>
            </template>
          </el-alert>
        </div>
        
        <el-alert
          v-if="!selectedEventId"
          title="請先選擇活動以查看該活動的票券類別"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        />
      </div>

      <el-table 
        :data="categories" 
        border 
        style="width: 100%" 
        v-if="selectedEventId"
        default-sort="{ prop: 'name', order: 'ascending' }"
      >
        <el-table-column prop="name" label="類別名稱" width="200" sortable />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="total_limit" label="總限額" width="100" sortable>
          <template #default="{ row }">
            {{ row.total_limit || '無限制' }}
          </template>
        </el-table-column>
        <el-table-column prop="daily_limit" label="每日限額" width="100" sortable>
          <template #default="{ row }">
            {{ row.daily_limit || '無限制' }}
          </template>
        </el-table-column>
        <el-table-column prop="per_phone_limit" label="每手機號限額" width="120" sortable>
          <template #default="{ row }">
            {{ row.per_phone_limit || 1 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
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
        <el-form-item label="活動" prop="event_id" v-if="!editingId">
          <el-select
            v-model="form.event_id"
            placeholder="請選擇活動"
            style="width: 100%"
            @change="(val) => { if (val) { selectedEvent.value = events.value.find(e => e.id === val); } }"
          >
            <el-option
              v-for="event in events"
              :key="event.id"
              :label="event.name"
              :value="event.id"
            />
          </el-select>
        </el-form-item>

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
            :max="getMaxTotalLimit()"
            placeholder="0表示無限制"
            style="width: 100%"
            @change="validateTotalLimit"
          />
          <div class="form-tip">
            0表示無限制
            <span v-if="selectedEvent && selectedEvent.max_attendees > 0" style="margin-left: 10px;">
              (活動上限: {{ selectedEvent.max_attendees }} 張，已分配: {{ getCurrentTotalLimitSum() }} 張，
              最多可設: {{ getMaxTotalLimit() }} 張)
            </span>
          </div>
          <div v-if="form.total_limit > 0 && selectedEvent && selectedEvent.max_attendees > 0" class="form-warning">
            <span v-if="getCurrentTotalLimitSum() > selectedEvent.max_attendees" style="color: #f56c6c;">
              ⚠️ 所有類別總限額 ({{ getCurrentTotalLimitSum() }}) 超過活動上限 ({{ selectedEvent.max_attendees }})
            </span>
            <span v-else-if="getCurrentTotalLimitSum() === selectedEvent.max_attendees" style="color: #e6a23c;">
              ✓ 總限額已達活動上限
            </span>
            <span v-else style="color: #67c23a;">
              ✓ 還可分配 {{ selectedEvent.max_attendees - getCurrentTotalLimitSum() }} 張
            </span>
          </div>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '../api';

const categories = ref([]);
const events = ref([]);
const selectedEventId = ref(null);
const selectedEvent = ref(null);
const showDialog = ref(false);
const dialogTitle = ref('新增類別');
const formRef = ref(null);
const editingId = ref(null);

const form = reactive({
  event_id: null,
  name: '',
  description: '',
  total_limit: 0,
  daily_limit: 0,
  per_phone_limit: 1
});

const rules = {
  event_id: [{ required: true, message: '請選擇活動', trigger: 'change' }],
  name: [{ required: true, message: '請輸入類別名稱', trigger: 'blur' }],
  total_limit: [
    {
      validator: (rule, value, callback) => {
        if (selectedEvent.value && selectedEvent.value.max_attendees > 0) {
          const currentSum = getCurrentTotalLimitSum();
          if (currentSum > selectedEvent.value.max_attendees) {
            callback(new Error(`所有類別總限額 (${currentSum}) 不能超過活動上限 (${selectedEvent.value.max_attendees})`));
            return;
          }
        }
        callback();
      },
      trigger: 'change'
    }
  ]
};

// 計算當前所有類別的總限額總和（包含正在編輯的）
const getCurrentTotalLimitSum = () => {
  let sum = 0;
  // 計算其他類別的總和（排除正在編輯的）
  categories.value.forEach(category => {
    if (category.id !== editingId.value) {
      const limit = category.total_limit || 0;
      sum += (limit > 0 ? limit : 0);
    }
  });
  // 加上當前表單中的限額
  const formLimit = form.total_limit || 0;
  if (formLimit > 0) {
    sum += formLimit;
  }
  return sum;
};

// 取得可設定的最大總限額
const getMaxTotalLimit = () => {
  if (!selectedEvent.value || selectedEvent.value.max_attendees <= 0) {
    return 999999;
  }
  // 計算其他類別的總和（排除正在編輯的）
  let otherSum = 0;
  categories.value.forEach(category => {
    if (category.id !== editingId.value) {
      const limit = category.total_limit || 0;
      otherSum += (limit > 0 ? limit : 0);
    }
  });
  // 計算可設定的最大值
  const maxLimit = selectedEvent.value.max_attendees - otherSum;
  return Math.max(0, maxLimit);
};

// 驗證總限額
const validateTotalLimit = () => {
  if (formRef.value) {
    formRef.value.validateField('total_limit');
  }
};

onMounted(async () => {
  await loadEvents();
});

const loadEvents = async () => {
  try {
    const result = await adminApi.getEvents();
    events.value = result.events || [];
  } catch (error) {
    ElMessage.error('載入活動列表失敗');
  }
};

const loadCategories = async (eventId = null) => {
  try {
    const result = await adminApi.getCategories(eventId);
    categories.value = result.categories || [];
    
    // 如果類別中有活動資訊，更新 selectedEvent
    if (categories.value.length > 0 && categories.value[0].max_attendees !== undefined) {
      const eventInfo = events.value.find(e => e.id === eventId);
      if (eventInfo) {
        selectedEvent.value = { ...eventInfo, max_attendees: categories.value[0].max_attendees };
      }
    } else if (eventId) {
      // 如果沒有類別，直接從 events 中取得活動資訊
      selectedEvent.value = events.value.find(e => e.id === eventId);
    }
  } catch (error) {
    ElMessage.error('載入類別列表失敗');
  }
};

const handleEventChange = async (eventId) => {
  selectedEventId.value = eventId;
  if (eventId) {
    selectedEvent.value = events.value.find(e => e.id === eventId);
    await loadCategories(eventId);
  } else {
    selectedEvent.value = null;
    categories.value = [];
  }
};

// 計算所有類別的總限額總和
const totalLimitSum = computed(() => {
  return categories.value.reduce((sum, category) => {
    const limit = category.total_limit || 0;
    return sum + (limit > 0 ? limit : 0);
  }, 0);
});

const handleCreate = () => {
  if (!selectedEventId.value) {
    ElMessage.warning('請先選擇活動');
    return;
  }
  dialogTitle.value = '新增類別';
  editingId.value = null;
  resetForm();
  form.event_id = selectedEventId.value;
  showDialog.value = true;
};

const handleEdit = (row) => {
  dialogTitle.value = '編輯類別';
  editingId.value = row.id;
  Object.assign(form, {
    event_id: row.event_id,
    name: row.name,
    description: row.description || '',
    total_limit: row.total_limit || 0,
    daily_limit: row.daily_limit || 0,
    per_phone_limit: row.per_phone_limit || 1
  });
  // 確保活動資訊已載入
  if (row.event_id && !selectedEvent.value) {
    selectedEvent.value = events.value.find(e => e.id === row.event_id);
  }
  showDialog.value = true;
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('確認刪除該類別吗？', '提示', {
      confirmButtonText: '確認',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await adminApi.deleteCategory(row.id);
    ElMessage.success('刪除成功');
    await loadCategories(selectedEventId.value);
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '刪除失敗');
    }
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
      await loadCategories(selectedEventId.value);
    } catch (error) {
      ElMessage.error(error.message || '操作失敗');
    }
  });
};

const resetForm = () => {
  Object.assign(form, {
    event_id: selectedEventId.value,
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

.form-warning {
  font-size: 12px;
  margin-top: 5px;
}

.filter-section {
  margin-bottom: 20px;
}

.event-limit-info {
  margin-top: 10px;
}
</style>