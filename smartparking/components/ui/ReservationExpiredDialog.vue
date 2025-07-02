<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-gray-200 bg-opacity-70 flex justify-center items-center z-50"
  >
    <div class="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center">
      <h2 class="text-xl font-semibold text-red-600">Reservation expired</h2>
      <p class="mt-2 text-gray-700">Your reservation has expired. Reloading...</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
});
</script>
