<template>
  <div class="register-form">
    <el-card>
      <template #header>
        <span>登记报名资料</span>
      </template>

      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="120px"
      >
        <el-form-item label="活动场次" prop="event_id" required>
          <el-select
            v-model="form.event_id"
            placeholder="请选择活动场次"
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

        <el-form-item label="票券类别" prop="ticket_category_id" required>
          <el-select
            v-model="form.ticket_category_id"
            placeholder="请选择票券类别"
            style="width: 100%"
            :disabled="!form.event_id"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="`${category.name} (限额: ${category.per_phone_limit}张/手机)`"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="姓名" prop="name" required>
          <el-input
            v-model="form.name"
            placeholder="请输入姓名"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item label="Email" prop="email" required>
          <el-input
            v-model="form.email"
            placeholder="请输入Email"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item label="手机号" prop="phone" required>
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            style="width: 300px"
          />
        </el-form-item>

        <el-form-item label="验证码" prop="code" required>
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
          <el-button type="primary" @click="submitForm">提交报名</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 报名成功对话框 -->
    <el-dialog
      v-model="showSuccessDialog"
      title="报名成功"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="resultTicket">
        <el-alert
          :title="successMessage"
          :type="resultTicket.requires_review ? 'warning' : 'success'"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <el-descriptions :column="1" border v-if="resultTicket.ticket">
          <el-descriptions-item label="活动名称">
            {{ resultTicket.ticket.event_name }}
          </el-descriptions-item>
          <el-descriptions-item label="票券条码">
            <el-text copyable>{{ resultTicket.ticket.barcode }}</el-text>
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 20px; text-align: center;" v-if="resultTicket.ticket">
          <el-button
            type="primary"
            @click="viewTicketDetail(resultTicket.ticket.token_id)"
          >
            查看票券详情
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
  event_id: [{ required: true, message: '请选择活动场次', trigger: 'change' }],
  ticket_category_id: [{ required: true, message: '请选择票券类别', trigger: 'change' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入Email', trigger: 'blur' },
    { type: 'email', message: '请输入正确的Email格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码为6位数字', trigger: 'blur' }
  ]
};

onMounted(async () => {
  try {
    const result = await ticketApi.getEvents();
    events.value = result.events;
  } catch (error) {
    ElMessage.error('获取活动列表失败');
  }
});

const handleEventChange = async (eventId) => {
  form.ticket_category_id = null;
  if (eventId) {
    try {
      const result = await ticketApi.getCategories();
      categories.value = result.categories;
    } catch (error) {
      ElMessage.error('获取票券类别失败');
    }
  }
};

const sendSMS = async () => {
  if (!form.phone) {
    ElMessage.warning('请先输入手机号');
    return;
  }

  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.warning('请输入正确的手机号');
    return;
  }

  try {
    await authApi.sendSMS(form.phone);
    ElMessage.success('验证码已发送');
    startCountdown();
  } catch (error) {
    ElMessage.error(error.message || '发送验证码失败');
  }
};

const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      // 先验证验证码
      await authApi.verifySMS(form.phone, form.code);

      // 提交报名
      const result = await registrationApi.register(form);
      
      resultTicket.value = result;
      successMessage.value = result.requires_review
        ? '报名已提交，需要审核，审核通过后将发送票券链接到您的邮箱和手机'
        : '报名成功！票券已生成，报到链接已发送到您的邮箱和手机';
      
      showSuccessDialog.value = true;

      // 如果不需要审核，3秒后跳转到票券详情页
      if (!result.requires_review && result.ticket) {
        setTimeout(() => {
          viewTicketDetail(result.ticket.token_id);
        }, 3000);
      }
    } catch (error) {
      ElMessage.error(error.message || '报名失败');
    }
  });
};

const resetForm = () => {
  formRef.value?.resetFields();
  countdown.value = 0;
};

const viewTicketDetail = (tokenId) => {
  router.push(`/ticket/${tokenId}`);
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