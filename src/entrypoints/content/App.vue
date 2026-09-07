<script setup lang="ts">
import { ref } from 'vue';
import type { PostData } from '@/types/post';
import ShareModal from '@/components/modal/ShareModal.vue';

const currentPost = ref<PostData | null>(null);
const isModalVisible = ref(false);

const openShareModal = (post: PostData) => {
  currentPost.value = post;
  isModalVisible.value = true;
};

const closeModal = () => {
  isModalVisible.value = false;
};

defineExpose({
  openShareModal,
});
</script>

<template>
  <div class="quick-share-root font-sans antialiased">
    <ShareModal
      v-if="currentPost && isModalVisible"
      :post="currentPost"
      :visible="isModalVisible"
      @close="closeModal"
    />
  </div>
</template>
