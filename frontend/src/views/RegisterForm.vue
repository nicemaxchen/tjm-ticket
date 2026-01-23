<template>
  <div class="register-form">
    <el-card>
      <template #header>
        <span>登記報名資料</span>
      </template>

      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="120px"
      >
        <el-form-item label="活動場次" prop="event_id" required>
          <el-select
            v-model="form.event_id"
            placeholder="請選擇活動場次"
            style="width: 100%"
            @change="handleEventChange"
          >
            <el-option
              v-for="event in events"
              :key="event.id"
              :label="event.name"
              :value="event.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="票券類別" prop="ticket_category_id" required>
          <el-select
            v-model="form.ticket_category_id"
            placeholder="請選擇票券類別"
            style="width: 100%"
            :disabled="!form.event_id"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="`${category.name} (限額: ${category.per_phone_limit}張/手機)`"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="姓名" prop="name" required>
          <el-input
            v-model="form.name"
            placeholder="請輸入姓名"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item label="Email" prop="email" required>
          <el-input
            v-model="form.email"
            placeholder="請輸入Email"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item label="手機號" prop="phone" required>
          <el-input
            v-model="form.phone"
            placeholder="請輸入手機號"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item label="驗證碼" prop="code" required>
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
          <el-button type="primary" @click="submitForm">提交報名</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 報名成功對話框 -->
    <el-dialog
      v-model="showSuccessDialog"
      title="報名成功"
      width="500px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <div v-if="resultTicket">
        <el-alert
          :title="successMessage"
          :type="resultTicket.requires_review ? 'warning' : 'success'"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <el-descriptions :column="1" border v-if="resultTicket.ticket">
          <el-descriptions-item label="活動名稱">
            {{ resultTicket.ticket.event_name }}
          </el-descriptions-item>
          <el-descriptions-item label="票券條碼">
            <el-text copyable>{{ resultTicket.ticket.barcode }}</el-text>
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px; text-align: center;">
          <el-button
            v-if="resultTicket.ticket"
            type="primary"
            @click="viewTicketDetail(resultTicket.ticket.token_id)"
            style="margin-right: 10px;"
          >
            查看票券詳情
          </el-button>
          <el-button
            type="default"
            @click="goToHome"
          >
            返回首頁
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ticketApi, registrationApi, authApi } from '../api';

const router = useRouter();
const formRef = ref(null);
const events = ref([]);
const categories = ref([]);
const countdown = ref(0);
const showSuccessDialog = ref(false);
const resultTicket = ref(null);
const successMessage = ref('');

const form = reactive({
  event_id: null,
  ticket_category_id: null,
  name: '',
  email: '',
  phone: '',
  code: '',
  is_from_liff: false,
  liff_user_id: null
});

const rules = {
  event_id: [{ required: true, message: '請選擇活動場次', trigger: 'change' }],
  ticket_category_id: [{ required: true, message: '請選擇票券類別', trigger: 'change' }],
  name: [{ required: true, message: '請輸入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '請輸入Email', trigger: 'blur' },
    { type: 'email', message: '請輸入正確的Email格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '請輸入手機號', trigger: 'blur' },
    { pattern: /^09\d{8}$/, message: '請輸入正確的手機號（格式：09XXXXXXXX）', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '請輸入驗證碼', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '驗證碼為6位数字', trigger: 'blur' }
  ]
};

onMounted(async () => {
  try {
    const result = await ticketApi.getEvents();
    events.value = result.events;
  } catch (error) {
    ElMessage.error('取得活動列表失敗');
  }
});

const handleEventChange = async (eventId) => {
  form.ticket_category_id = null;
  if (eventId) {
    try {
      const result = await ticketApi.getCategories(eventId);
      categories.value = result.categories || [];
    } catch (error) {
      ElMessage.error('取得票券類別失敗');
    }
  } else {
    categories.value = [];
  }
};

const sendSMS = async () => {
  if (!form.phone) {
    ElMessage.warning('請先輸入手機號');
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
    
    startCountdown();
  } catch (error) {
    ElMessage.error(error.message || '發送驗證碼失敗');
    console.error('發送驗證碼錯誤:', error);
  }
};

const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      // 先驗證驗證碼
      await authApi.verifySMS(form.phone, form.code);

      // 提交報名
      const result = await registrationApi.register(form);
      
      resultTicket.value = result;
      successMessage.value = result.requires_review
        ? '報名已提交，需要審核，審核通過後將發送票券連結到您的郵箱和手機'
        : '報名成功！票券已產生，報到連結已發送到您的郵箱和手機';
      
      showSuccessDialog.value = true;

      // 3秒後自動關閉對話框並返回首頁
      setTimeout(() => {
        showSuccessDialog.value = false;
        goToHome();
      }, 3000);
    } catch (error) {
      ElMessage.error(error.message || '報名失敗');
    }
  });
};

const resetForm = () => {
  formRef.value?.resetFields();
  countdown.value = 0;
};

const viewTicketDetail = (tokenId) => {
  showSuccessDialog.value = false;
  router.push(`/ticket/${tokenId}`);
};

const goToHome = () => {
  showSuccessDialog.value = false;
  router.push('/');
};

const handleDialogClose = () => {
  // 對話框關閉時返回首頁
  goToHome();
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
.register-form {
  max-width: 700px;
  margin: 0 auto;
}
</style>