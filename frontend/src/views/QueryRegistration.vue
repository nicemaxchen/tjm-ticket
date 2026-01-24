<template>
  <div class="query-registration">
    <el-card>
      <template #header>
        <span>查詢報名資料</span>
      </template>

      <el-form :model="form" label-width="120px" v-if="!verified" @submit.prevent>
        <el-form-item label="手機號" required>
          <el-input
            v-model="form.phone"
            placeholder="請輸入手機號"
            style="width: 300px"
            @keydown.enter.prevent="handleVerify"
          />
        </el-form-item>

        <el-form-item v-if="showVerificationCode" label="驗證碼">
          <el-input
            v-model="form.code"
            placeholder="請輸入6位驗證碼"
            style="width: 200px"
            maxlength="6"
            @keydown.enter.prevent="handleVerify"
          />
          <el-button
            :disabled="countdown > 0"
            @click="sendSMS"
            style="margin-left: 10px"
          >
            {{ countdown > 0 ? `${countdown}秒後重新發送` : '發送驗證碼' }}
          </el-button>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleVerify">查詢</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <div v-if="verified">
        <!-- 已通過審查的票券 -->
        <div v-if="tickets.length > 0" style="margin-bottom: 30px;">
          <el-alert
            title="已通過審查"
            type="success"
            :closable="false"
            style="margin-bottom: 20px"
          />

          <div class="ticket-list">
            <el-card 
              v-for="(ticket, index) in tickets" 
              :key="index"
              class="ticket-card"
              shadow="hover"
            >
              <el-descriptions :column="1" border>
                <el-descriptions-item label="活動名稱">
                  {{ ticket.event_name }}
                </el-descriptions-item>
                <el-descriptions-item label="活動地點" v-if="ticket.event_location">
                  {{ ticket.event_location }}
                </el-descriptions-item>
                <el-descriptions-item label="票券類別">
                  {{ ticket.category_name }}
                </el-descriptions-item>
                <el-descriptions-item label="條碼">
                  <el-text copyable style="font-size: 16px; font-weight: bold;">
                    {{ ticket.barcode }}
                  </el-text>
                </el-descriptions-item>
                <el-descriptions-item label="報到狀態">
                  <el-tag :type="ticket.checkin_status === 'checked' ? 'success' : 'info'">
                    {{ ticket.checkin_status === 'checked' ? '已報到' : '未報到' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
              <div class="ticket-actions">
                <el-button
                  type="primary"
                  @click="viewTicket(ticket)"
                >
                  查看票券
                </el-button>
                <el-button
                  v-if="ticket.checkin_status === 'unchecked'"
                  type="success"
                  @click="handleCheckin(ticket)"
                >
                  掃碼報到
                </el-button>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 待審查記錄 -->
        <div v-if="pendingRegistrations.length > 0" style="margin-bottom: 30px;">
          <el-alert
            title="審查中"
            type="warning"
            :closable="false"
            style="margin-bottom: 20px"
          />
          <div class="ticket-list">
            <el-card 
              v-for="(item, index) in pendingRegistrations" 
              :key="index"
              class="ticket-card"
              shadow="hover"
            >
              <el-descriptions :column="1" border>
                <el-descriptions-item label="活動名稱">
                  {{ item.event_name }}
                </el-descriptions-item>
                <el-descriptions-item label="活動地點" v-if="item.event_location">
                  {{ item.event_location }}
                </el-descriptions-item>
                <el-descriptions-item label="票券類別">
                  {{ item.category_name }}
                </el-descriptions-item>
                <el-descriptions-item label="狀態">
                  <el-tag type="warning">審查中</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="報名時間">
                  {{ formatDate(item.created_at) }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </div>
        </div>

        <!-- 被拒絕記錄 -->
        <div v-if="rejectedRegistrations.length > 0" style="margin-bottom: 30px;">
          <el-alert
            title="審核不通過"
            type="error"
            :closable="false"
            style="margin-bottom: 20px"
          />
          <div class="ticket-list">
            <el-card 
              v-for="(item, index) in rejectedRegistrations" 
              :key="index"
              class="ticket-card"
              shadow="hover"
            >
              <el-descriptions :column="1" border>
                <el-descriptions-item label="活動名稱">
                  {{ item.event_name }}
                </el-descriptions-item>
                <el-descriptions-item label="活動地點" v-if="item.event_location">
                  {{ item.event_location }}
                </el-descriptions-item>
                <el-descriptions-item label="票券類別">
                  {{ item.category_name }}
                </el-descriptions-item>
                <el-descriptions-item label="狀態">
                  <el-tag type="danger">審核不通過</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="報名時間">
                  {{ formatDate(item.created_at) }}
                </el-descriptions-item>
                <el-descriptions-item label="拒絕原因" v-if="item.rejection_reason">
                  <div style="color: #f56c6c; white-space: pre-wrap;">{{ item.rejection_reason }}</div>
                </el-descriptions-item>
                <el-descriptions-item label="拒絕原因" v-else>
                  <span style="color: #909399;">無備註</span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </div>
        </div>

        <!-- 如果沒有任何記錄 -->
        <div v-if="tickets.length === 0 && pendingRegistrations.length === 0 && rejectedRegistrations.length === 0">
          <el-alert
            title="查詢結果"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          />
          <el-card class="ticket-card" shadow="hover">
            <div style="text-align: center; padding: 40px 20px;">
              <div style="font-size: 48px; color: #909399; margin-bottom: 15px;">📋</div>
              <div style="font-size: 16px; color: #909399;">未找到相關報名記錄</div>
            </div>
          </el-card>
        </div>

        <!-- 重新查詢按鈕 -->
        <div style="margin-top: 20px; text-align: center;">
          <el-button type="default" @click="reset">重新查詢</el-button>
        </div>
      </div>
    </el-card>

    <!-- 票券詳情對話框 -->
    <el-dialog v-model="showTicketDialog" title="票券詳情" width="500px">
      <div v-if="selectedTicket" class="ticket-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="活動名稱">
            {{ selectedTicket.event_name }}
          </el-descriptions-item>
          <el-descriptions-item label="活動地點" v-if="selectedTicket.event_location">
            {{ selectedTicket.event_location }}
          </el-descriptions-item>
          <el-descriptions-item label="票券類別">
            {{ selectedTicket.category_name }}
          </el-descriptions-item>
          <el-descriptions-item label="條碼">
            <el-text copyable>{{ selectedTicket.barcode }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="報到狀態">
            <el-tag :type="selectedTicket.checkin_status === 'checked' ? 'success' : 'info'">
              {{ selectedTicket.checkin_status === 'checked' ? '已報到' : '未報到' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div class="barcode-display" style="text-align: center; margin-top: 20px;">
          <el-text style="font-size: 24px; font-weight: bold;">{{ selectedTicket.barcode }}</el-text>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { registrationApi, authApi } from '../api';

const router = useRouter();
const form = reactive({
  phone: '',
  code: ''
});

const verified = ref(false);
const showVerificationCode = ref(false);
const countdown = ref(0);
const tickets = ref([]);
const pendingRegistrations = ref([]);
const rejectedRegistrations = ref([]);
const showTicketDialog = ref(false);
const selectedTicket = ref(null);

const sendSMS = async () => {
  if (!form.phone) {
    ElMessage.warning('請輸入手機號');
    return;
  }

  if (!/^09\d{8}$/.test(form.phone)) {
    ElMessage.warning('請輸入正確的手機號（格式：09XXXXXXXX）');
    return;
  }

  try {
    const result = await authApi.sendSMS(form.phone);
    console.log('📱 API 響應:', result);
    ElMessage.success('驗證碼已發送');
    
    // 開發環境：在控制台顯示驗證碼
    if (result.code) {
      console.log(`📱 驗證碼 [${form.phone}]: ${result.code}`);
      ElMessage.info(`開發環境驗證碼：${result.code}`);
    } else {
      console.warn('⚠️ API 響應中沒有 code 字段，完整響應:', result);
      ElMessage.warning('驗證碼已發送，但未返回驗證碼（請查看後端控制台）');
    }
    
    showVerificationCode.value = true;
    startCountdown();
  } catch (error) {
    ElMessage.error(error.message || '發送驗證碼失敗');
    console.error('發送驗證碼錯誤:', error);
  }
};

const handleVerify = async () => {
  if (!form.phone) {
    ElMessage.warning('請輸入手機號');
    return;
  }

  if (showVerificationCode.value && !form.code) {
    ElMessage.warning('請輸入驗證碼');
    return;
  }

  try {
    // 如果顯示了驗證碼輸入框，先驗證驗證碼
    if (showVerificationCode.value) {
      await authApi.verifySMS(form.phone, form.code);
    }

    // 驗證成功后查詢報名資料
    const result = await registrationApi.queryRegistration(form.phone);
    tickets.value = result.tickets || [];
    pendingRegistrations.value = result.pendingRegistrations || [];
    rejectedRegistrations.value = result.rejectedRegistrations || [];
    verified.value = true;
    
    if (result.tickets.length === 0 && result.pendingRegistrations.length === 0 && result.rejectedRegistrations.length === 0) {
      ElMessage.info('未找到相關報名記錄');
    } else {
      const messages = [];
      if (result.tickets.length > 0) messages.push(`${result.tickets.length} 筆已通過`);
      if (result.pendingRegistrations.length > 0) messages.push(`${result.pendingRegistrations.length} 筆審查中`);
      if (result.rejectedRegistrations.length > 0) messages.push(`${result.rejectedRegistrations.length} 筆不通過`);
      if (messages.length > 0) {
        ElMessage.info(`找到 ${messages.join('、')} 的記錄`);
      }
    }
  } catch (error) {
    ElMessage.error(error.message || '驗證失敗');
  }
};

const handleCheckin = async (ticket) => {
  try {
    await ElMessageBox.confirm('確認進行報到嗎？', '報到確認', {
      confirmButtonText: '確認',
      cancelButtonText: '取消',
      type: 'info'
    });

    const result = await registrationApi.checkin({
      token_id: ticket.token_id,
      barcode: ticket.barcode
    });

    if (result.success) {
      ElMessage.success('報到成功！');
      // 更新票券狀態
      ticket.checkin_status = 'checked';
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '報到失敗');
    }
  }
};

const viewTicket = (ticket) => {
  selectedTicket.value = ticket;
  showTicketDialog.value = true;
};

const reset = () => {
  form.phone = '';
  form.code = '';
  verified.value = false;
  showVerificationCode.value = false;
  tickets.value = [];
  pendingRegistrations.value = [];
  rejectedRegistrations.value = [];
  countdown.value = 0;
};

const goToHome = () => {
  router.push('/');
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const startCountdown = () => {
  countdown.value = 60;
  const timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
    }
  }, 1000);
};
</script>

<style scoped>
.query-registration {
  max-width: 900px;
  margin: 0 auto;
}

.ticket-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ticket-card {
  margin-bottom: 0;
}

.ticket-card :deep(.el-card__body) {
  padding: 20px;
}

.ticket-actions {
  margin-top: 20px;
  text-align: center;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.ticket-actions .el-button {
  margin: 0 5px;
}

.ticket-detail {
  padding: 20px 0;
}

.barcode-display {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>