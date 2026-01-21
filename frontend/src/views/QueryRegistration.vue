<template>
  <div class="query-registration">
    <el-card>
      <template #header>
        <span>查詢報名資料</span>
      </template>

      <el-form :model="form" label-width="120px" v-if="!verified">
        <el-form-item label="手機號" required>
          <el-input
            v-model="form.phone"
            placeholder="請輸入手機號"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item v-if="showVerificationCode" label="驗證碼">
          <el-input
            v-model="form.code"
            placeholder="請輸入6位驗證碼"
            style="width: 200px"
            maxlength="6"
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
          <el-button type="primary" @click="handleVerify">驗證</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <div v-if="verified && tickets.length > 0">
        <el-alert
          title="查詢成功"
          type="success"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <el-table :data="tickets" border>
          <el-table-column prop="event_name" label="活動名稱" width="200" />
          <el-table-column prop="category_name" label="票券類別" width="150" />
          <el-table-column prop="barcode" label="條碼" width="180" />
          <el-table-column prop="checkin_status" label="報到狀態" width="120">
            <template #default="{ row }">
              <el-tag :type="row.checkin_status === 'checked' ? 'success' : 'info'">
                {{ row.checkin_status === 'checked' ? '已報到' : '未報到' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="viewTicket(row)"
              >
                查看票券
              </el-button>
              <el-button
                v-if="row.checkin_status === 'unchecked'"
                type="success"
                size="small"
                @click="handleCheckin(row)"
              >
                掃碼報到
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-empty v-if="verified && tickets.length === 0" description="未找到相關報名記錄" />
    </el-card>

    <!-- 票券詳情對話框 -->
    <el-dialog v-model="showTicketDialog" title="票券詳情" width="500px">
      <div v-if="selectedTicket" class="ticket-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="活動名稱">
            {{ selectedTicket.event_name }}
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { registrationApi, authApi } from '../api';

const form = reactive({
  phone: '',
  code: ''
});

const verified = ref(false);
const showVerificationCode = ref(false);
const countdown = ref(0);
const tickets = ref([]);
const showTicketDialog = ref(false);
const selectedTicket = ref(null);

const sendSMS = async () => {
  if (!form.phone) {
    ElMessage.warning('請輸入手機號');
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.warning('請輸入正確的手機號');
    return;
  }

  try {
    await authApi.sendSMS(form.phone);
    ElMessage.success('驗證碼已發送');
    showVerificationCode.value = true;
    startCountdown();
  } catch (error) {
    ElMessage.error(error.message || '發送驗證碼失敗');
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
    tickets.value = result.tickets;
    verified.value = true;
    
    if (result.tickets.length === 0) {
      ElMessage.info('未找到相關報名記錄');
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
  countdown.value = 0;
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

.ticket-detail {
  padding: 20px 0;
}

.barcode-display {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>