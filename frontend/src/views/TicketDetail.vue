<template>
  <div class="ticket-detail">
    <el-card v-if="ticket">
      <template #header>
        <span>票券详情</span>
      </template>

      <el-descriptions :column="1" border>
        <el-descriptions-item label="活动名称">
          {{ ticket.event_name }}
        </el-descriptions-item>
        <el-descriptions-item label="活动日期">
          {{ formatDate(ticket.event_date) }}
        </el-descriptions-item>
        <el-descriptions-item label="票券类别">
          {{ ticket.category_name }}
        </el-descriptions-item>
        <el-descriptions-item label="姓名">
          {{ ticket.user_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ ticket.phone }}
        </el-descriptions-item>
        <el-descriptions-item label="票券条码">
          <el-text copyable style="font-size: 18px; font-weight: bold;">
            {{ ticket.barcode }}
          </el-text>
        </el-descriptions-item>
        <el-descriptions-item label="报到状态">
          <el-tag :type="ticket.checkin_status === 'checked' ? 'success' : 'info'">
            {{ ticket.checkin_status === 'checked' ? '已报到' : '未报到' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div class="barcode-section">
        <h3>报到条码</h3>
        <div class="barcode-display">
          <el-text style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">
            {{ ticket.barcode }}
          </el-text>
        </div>
      </div>

      <div class="actions" v-if="ticket.checkin_status === 'unchecked'">
        <el-button type="success" size="large" @click="handleCheckin">
          扫码报到
        </el-button>
      </div>
    </el-card>

    <el-empty v-else description="票券不存在或加载中..." />
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
    ElMessage.error(error.message || '获取票券详情失败');
  }
});

const handleCheckin = async () => {
  try {
    await ElMessageBox.confirm('确认进行报到吗？', '报到确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info'
    });

    const result = await registrationApi.checkin({
      token_id: ticket.value.token_id,
      barcode: ticket.value.barcode
    });

    if (result.success) {
      ElMessage.success('报到成功！');
      // 重新加载票券信息
      const result2 = await registrationApi.getTicket(ticket.value.token_id);
      ticket.value = result2.ticket;
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '报到失败');
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