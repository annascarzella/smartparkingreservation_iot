<template>
    <div
      v-if="show"
      class="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50 px-5"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-96">
        <h2 class="text-xl font-semibold mb-4">Extend reservation</h2>
        <div class="mb-4">
          <p><strong>Current End:</strong> {{ formatDate(currentEnd) }}</p>
          <p>
            <strong>Will Extend By:</strong>
            {{ duration }} minutes
          </p>
        </div>
        <div class="flex items-center space-x-2 mb-4">
          <button
            type="button"
            @click="decreaseDuration"
            class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            :disabled="duration <= 5"
          >
            −
          </button>
          <input
            type="number"
            v-model="duration"
            class="border rounded px-3 py-2 text-center"
            readonly
          />
          <button
            type="button"
            @click="increaseDuration"
            class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            :disabled="duration >= 180"
          >
            +
          </button>
        </div>
        <p v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</p>
        <p v-if="successMessage" class="text-green-500 mt-2">{{ successMessage }}</p>
        <div class="flex justify-end space-x-2 pt-4">
          <button
            @click="close"
            class="px-4 py-2 bg-gray-300 rounded"
          >
            Cancel
          </button>
          <button
            @click="handleExtend"
            class="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const props = defineProps({
    show: Boolean,
    currentEnd: String,
    reservationId: Number,
    errorMessage: String,
    successMessage: String,
  })
  const emit = defineEmits(['close', 'submit'])
  
  const duration = ref(5)
  
  function increaseDuration() {
    if (duration.value < 180) duration.value += 5
  }
  function decreaseDuration() {
    if (duration.value > 5) duration.value -= 5
  }
  function handleExtend() {
    emit('submit', { reservationId: props.reservationId, extendBy: duration.value })
  }
  function close() {
    emit('close')
  }
  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  </script>
  