<template>
  <div class="query-registration">
    <el-card>
      <template #header>
        <span>查询报名资料</span>
      </template>

      <el-form :model="form" label-width="120px" v-if="!verified">
        <el-form-item label="手机号" required>
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item v-if="showVerificationCode" label="验证码">
          <el-input
            v-model="form.code"
            placeholder="请输入6位验证码"
            style="width: 200px"
            maxlength="6"
          />
          <el-button
            :disabled="countdown > 0"
            @click="sendSMS"
            style="margin-left: 10px"
          >
            {{ countdown > 0 ? `${countdown}秒后重新发送` : '发送验证码' }}
          </el-button>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleVerify">验证</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <div v-if="verified && tickets.length > 0">
        <el-alert
          title="查询成功"
          type="success"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <el-table :data="tickets" border>
          <el-table-column prop="event_name" label="活动名称" width="200" />
          <el-table-column prop="category_name" label="票券类别" width="150" />
          <el-table-column prop="barcode" label="条码" width="180" />
          <el-table-column prop="checkin_status" label="报到状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.checkin_status === 'checked' ? 'success' : 'info'">
                {{ row.checkin_status === 'checked' ? '已报到' : '未报到' }}
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
                扫码报到
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-empty v-if="verified && tickets.length === 0" description="未找到相关报名记录" />
    </el-card>

    <!-- 票券详情对话框 -->
    <el-dialog v-model="showTicketDialog" title="票券详情" width="500px">
      <div v-if="selectedTicket" class="ticket-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="活动名称">
            {{ selectedTicket.event_name }}
          </el-descriptions-item>
          <el-descriptions-item label="票券类别">
            {{ selectedTicket.category_name }}
          </el-descriptions-item>
          <el-descriptions-item label="条码">
            <el-text copyable>{{ selectedTicket.barcode }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="报到状态">
            <el-tag :type="selectedTicket.checkin_status === 'checked' ? 'success' : 'info'">
              {{ selectedTicket.checkin_status === 'checked' ? '已报到' : '未报到' }}
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
    ElMessage.warning('请输入手机号');
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.warning('请输入正确的手机号');
    return;
  }

  try {
    await authApi.sendSMS(form.phone);
    ElMessage.success('验证码已发送');
    showVerificationCode.value = true;
    startCountdown();
  } catch (error) {
    ElMessage.error(error.message || '发送验证码失败');
  }
};

const handleVerify = async () => {
  if (!form.phone) {
    ElMessage.warning('请输入手机号');
    return;
  }

  if (showVerificationCode.value && !form.code) {
    ElMessage.warning('请输入验证码');
    return;
  }

  try {
    // 如果显示了验证码输入框，先验证验证码
    if (showVerificationCode.value) {
      await authApi.verifySMS(form.phone, form.code);
    }

    // 验证成功后查询报名资料
    const result = await registrationApi.queryRegistration(form.phone);
    tickets.value = result.tickets;
    verified.value = true;
    
    if (result.tickets.length === 0) {
      ElMessage.info('未找到相关报名记录');
    }
  } catch (error) {
    ElMessage.error(error.message || '验证失败');
  }
};

const handleCheckin = async (ticket) => {
  try {
    await ElMessageBox.confirm('确认进行报到吗？', '报到确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    });

    const result = await registrationApi.checkin({
      token_id: ticket.token_id,
      barcode: ticket.barcode
    });

    if (result.success) {
      ElMessage.success('报到成功！');
      // 更新票券状态
      ticket.checkin_status = 'checked';
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '报到失败');
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