<template>
  <div class="ticket-detail">
    <el-card v-if="ticket">
      <template #header>
        <span>票券詳情</span>
      </template>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="活動名稱">
          {{ ticket.event_name }}
        </el-descriptions-item>
        <el-descriptions-item label="活動日期">
          {{ formatDate(ticket.event_date) }}
        </el-descriptions-item>
        <el-descriptions-item label="活動地點" v-if="ticket.event_location">
          {{ ticket.event_location }}
        </el-descriptions-item>
        <el-descriptions-item label="票券類別">
          {{ ticket.category_name }}
        </el-descriptions-item>
        <el-descriptions-item label="姓名">
          {{ ticket.user_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="手機號">
          {{ ticket.phone }}
        </el-descriptions-item>
        <el-descriptions-item label="票券條碼">
          <el-text copyable style="font-size: 18px; font-weight: bold;">
            {{ ticket.barcode }}
          </el-text>
        </el-descriptions-item>
        <el-descriptions-item label="報到狀態">
          <el-tag :type="ticket.checkin_status === 'checked' ? 'success' : 'info'">
            {{ ticket.checkin_status === 'checked' ? '已報到' : '未報到' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div class="barcode-section">
        <h3>報到條碼</h3>
        <div class="barcode-display">
          <el-text style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">
            {{ ticket.barcode }}
          </el-text>
        </div>
      </div>

      <div class="actions" v-if="ticket.checkin_status === 'unchecked'">
        <el-button type="success" size="large" @click="handleCheckin">
          掃碼報到
        </el-button>
      </div>
    </el-card>

    <el-empty v-else description="票券不存在或載入中..." />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { registrationApi } from '../api';

const route = useRoute();
const router = useRouter();
const ticket = ref(null);

onMounted(async () => {
  const tokenId = route.params.tokenId;
  try {
    const result = await registrationApi.getTicket(tokenId);
    ticket.value = result.ticket;
  } catch (error) {
    ElMessage.error(error.message || '取得票券詳情失敗');
  }
});

const handleCheckin = async () => {
  try {
    await ElMessageBox.confirm('確認進行報到嗎？', '報到確認', {
      confirmButtonText: '確認',
      cancelButtonText: '取消',
      type: 'info'
    });

    const result = await registrationApi.checkin({
      token_id: ticket.value.token_id,
      barcode: ticket.value.barcode
    });

    if (result.success) {
      ElMessage.success('報到成功！');
      // 重新載入票券資訊
      const result2 = await registrationApi.getTicket(ticket.value.token_id);
      ticket.value = result2.ticket;
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '報到失敗');
    }
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-TW');
};
</script>

<style scoped>
.ticket-detail {
  max-width: 800px;
  margin: 0 auto;
}

.barcode-section {
  margin-top: 30px;
  text-align: center;
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.barcode-section h3 {
  margin: 0 0 20px 0;
  color: white;
}

.barcode-display {
  padding: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.barcode-display .el-text {
  color: white;
}

.actions {
  margin-top: 30px;
  text-align: center;
}
</style>