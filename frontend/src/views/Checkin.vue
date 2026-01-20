<template>
  <div class="checkin">
    <el-card>
      <template #header>
        <span>扫码报到</span>
      </template>

      <div v-if="loading">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="ticket">
        <el-result
          :icon="ticket.checkin_status === 'checked' ? 'success' : 'info'"
          :title="ticket.checkin_status === 'checked' ? '已报到' : '未报到'"
          :sub-title="ticket.checkin_status === 'checked' ? '您已完成报到' : '点击下方按钮进行报到'"
        >
          <template #extra>
            <el-descriptions :column="1" border style="margin: 20px 0;">
              <el-descriptions-item label="活动名称">
                {{ ticket.event_name }}
              </el-descriptions-item>
              <el-descriptions-item label="票券条码">
                {{ ticket.barcode }}
              </el-descriptions-item>
              <el-descriptions-item label="报到状态">
                <el-tag :type="ticket.checkin_status === 'checked' ? 'success' : 'info'">
                  {{ ticket.checkin_status === 'checked' ? '已报到' : '未报到' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <el-button
              v-if="ticket.checkin_status === 'unchecked'"
              type="primary"
              size="large"
              @click="handleCheckin"
            >
              确认报到
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
    ElMessage.error(error.message || '获取票券详情失败');
  } finally {
    loading.value = false;
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
</script>

<style scoped>
.checkin {
  max-width: 800px;
  margin: 0 auto;
}
</style>