<template>
  <div class="checkin">
    <el-card>
      <template #header>
        <span>掃碼報到</span>
      </template>

      <div v-if="loading">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="ticket">
        <el-result
          :icon="ticket.checkin_status === 'checked' ? 'success' : 'info'"
          :title="ticket.checkin_status === 'checked' ? '已報到' : '未報到'"
          :sub-title="ticket.checkin_status === 'checked' ? '您已完成報到' : '點擊下方按鈕進行報到'"
        >
          <template #extra>
            <el-descriptions :column="1" border style="margin: 20px 0;">
              <el-descriptions-item label="活動名稱">
                {{ ticket.event_name }}
              </el-descriptions-item>
              <el-descriptions-item label="活動地點" v-if="ticket.event_location">
                {{ ticket.event_location }}
              </el-descriptions-item>
              <el-descriptions-item label="票券條碼">
                {{ ticket.barcode }}
              </el-descriptions-item>
              <el-descriptions-item label="報到狀態">
                <el-tag :type="ticket.checkin_status === 'checked' ? 'success' : 'info'">
                  {{ ticket.checkin_status === 'checked' ? '已報到' : '未報到' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <el-button
              v-if="ticket.checkin_status === 'unchecked'"
              type="primary"
              size="large"
              @click="handleCheckin"
            >
              確認報到
            </el-button>
          </template>
        </el-result>
      </div>

      <el-empty v-else description="票券不存在" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { registrationApi } from '../api';

const route = useRoute();
const ticket = ref(null);
const loading = ref(true);

onMounted(async () => {
  const tokenId = route.params.tokenId;
  try {
    const result = await registrationApi.getTicket(tokenId);
    ticket.value = result.ticket;
  } catch (error) {
    ElMessage.error(error.message || '取得票券詳情失敗');
  } finally {
    loading.value = false;
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
</script>

<style scoped>
.checkin {
  max-width: 800px;
  margin: 0 auto;
}
</style>