<template>
  <header class="bg-gray-100 shadow-sm sticky top-0 z-50">
    <div
      class="relative flex items-center justify-between h-16 mx-4 md:mx-8 lg:mx-16"
    >
      <div class="flex items-center">
        <img src="/favicon.ico" alt="Logo" class="h-8 w-8 mr-2" />
        SmartParking
      </div>

      <button
        class="px-4 py-2 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-900 transition text-sm"
        @click="logoutDialog"
      >
        Logout
      </button>
    </div>
  </header>
  <LogoutDialog
    v-if="showLogoutDialog"
    :show="showLogoutDialog"
    @close="showLogoutDialog = false"
  />
</template>

<script setup>
import LogoutDialog from "./LogoutDialog.vue";

const showLogoutDialog = ref(false);
const logoutDialog = () => {
  showLogoutDialog.value = true;
};
</script>
