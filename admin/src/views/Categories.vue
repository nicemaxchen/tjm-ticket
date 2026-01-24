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
        ref="tableRef"
        :data="categories" 
        border 
        style="width: 100%" 
        v-if="selectedEventId"
        row-key="id"
        class="draggable-table"
      >
        <el-table-column label="" width="50" align="center" header-align="center">
          <template #default>
            <el-icon class="drag-handle" style="cursor: move; color: #909399;">
              <Rank />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="類別名稱" width="200" header-align="center" />
        <el-table-column prop="description" label="描述" header-align="center" />
        <el-table-column prop="total_limit" label="總限額" width="100" header-align="center">
          <template #default="{ row }">
            {{ row.total_limit || '無限制' }}
          </template>
        </el-table-column>
        <el-table-column prop="daily_limit" label="每日限額" width="100" header-align="center">
          <template #default="{ row }">
            {{ row.daily_limit || '無限制' }}
          </template>
        </el-table-column>
        <el-table-column prop="identity_type" label="身份類別" width="120" header-align="center">
          <template #default="{ row }">
            <el-tag :type="row.identity_type === 'vip' ? 'warning' : 'info'">
              {{ row.identity_type === 'vip' ? '貴賓' : '一般' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="requires_review" label="需審查" width="100" header-align="center">
          <template #default="{ row }">
            <el-tag :type="row.requires_review ? 'warning' : 'success'">
              {{ row.requires_review ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="allow_collection" label="開放索票" width="100" header-align="center">
          <template #default="{ row }">
            <el-tag :type="(row.allow_collection === 1 || row.allow_collection === true || row.allow_collection === null || row.allow_collection === undefined) ? 'success' : 'info'">
              {{ (row.allow_collection === 1 || row.allow_collection === true || row.allow_collection === null || row.allow_collection === undefined) ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" header-align="center">
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

        <el-form-item label="身份類別" prop="identity_type">
          <el-select
            v-model="form.identity_type"
            placeholder="請選擇身份類別"
            style="width: 100%"
          >
            <el-option label="一般" value="general" />
            <el-option label="貴賓" value="vip" />
          </el-select>
          <div class="form-tip form-tip-right">
            選擇此類別的身份類別，限額由活動設定中的對應身份限額決定
          </div>
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

        <el-form-item label="是否需要審查" prop="requires_review">
          <el-switch
            v-model="form.requires_review"
            active-text="是"
            inactive-text="否"
          />
          <div class="form-tip form-tip-right">
            開啟後，報名此類別的資料將進入待審查名單
          </div>
        </el-form-item>

        <el-form-item label="是否開放索票" prop="allow_collection">
          <el-switch
            v-model="form.allow_collection"
            active-text="是"
            inactive-text="否"
          />
          <div class="form-tip form-tip-right">
            開啟後，報名此類別可直接取得票券，無需審查
          </div>
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
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Rank } from '@element-plus/icons-vue';
import Sortable from 'sortablejs';
import { adminApi } from '../api';

const categories = ref([]);
const events = ref([]);
const selectedEventId = ref(null);
const selectedEvent = ref(null);
const showDialog = ref(false);
const dialogTitle = ref('新增類別');
const formRef = ref(null);
const tableRef = ref(null);
const editingId = ref(null);
let sortableInstance = null;

const form = reactive({
  event_id: null,
  name: '',
  description: '',
  total_limit: 0,
  daily_limit: 0,
  identity_type: 'general',
  requires_review: false,
  allow_collection: true
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
    
    // 初始化拖拽排序
    await nextTick();
    initSortable();
  } catch (error) {
    ElMessage.error('載入類別列表失敗');
  }
};

// 初始化拖拽排序
const initSortable = () => {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
  
  if (!tableRef.value || !selectedEventId.value) return;
  
  const tbody = tableRef.value.$el.querySelector('.el-table__body-wrapper tbody');
  if (!tbody) return;
  
  sortableInstance = Sortable.create(tbody, {
    handle: '.drag-handle',
    animation: 150,
    onEnd: async (evt) => {
      const { oldIndex, newIndex } = evt;
      if (oldIndex === newIndex) return;
      
      // 更新本地数组顺序
      const movedItem = categories.value.splice(oldIndex, 1)[0];
      categories.value.splice(newIndex, 0, movedItem);
      
      // 保存排序到数据库
      await saveCategoryOrder();
    }
  });
};

// 保存類別排序
const saveCategoryOrder = async () => {
  try {
    const categoryIds = categories.value.map(cat => cat.id);
    await adminApi.updateCategoryOrder(categoryIds);
    ElMessage.success('排序已更新');
  } catch (error) {
    ElMessage.error('更新排序失敗');
    // 如果失败，重新加载列表
    await loadCategories(selectedEventId.value);
  }
};

const handleEventChange = async (eventId) => {
  // 销毁旧的拖拽实例
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
  
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
    identity_type: row.identity_type || 'general',
    requires_review: row.requires_review ? true : false,
    allow_collection: (row.allow_collection === 1 || row.allow_collection === true || row.allow_collection === null || row.allow_collection === undefined) ? true : false
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
    identity_type: 'general',
    requires_review: false,
    allow_collection: true
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

.form-tip-right {
  text-align: right;
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

.drag-handle {
  cursor: move;
  font-size: 18px;
  color: #909399;
  user-select: none;
}

.drag-handle:hover {
  color: #409eff;
}

.draggable-table :deep(.sortable-ghost) {
  opacity: 0.5;
  background: #f0f0f0;
}

.draggable-table :deep(.sortable-chosen) {
  cursor: move;
}

/* 表格標題樣式 */
:deep(.el-table th.el-table__cell) {
  background-color: #f5f7fa;
  text-align: center;
  color: #555555;
}
</style>