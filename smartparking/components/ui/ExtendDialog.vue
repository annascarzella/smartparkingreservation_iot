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
          :disabled="duration <= 5 || isSubmitting"
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
          :disabled="duration >= 180 || isSubmitting"
        >
          +
        </button>
      </div>
      <p v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</p>
      <p v-if="successMessage" class="text-green-500 mt-2">
        {{ successMessage }}
      </p>
      <div class="flex justify-end space-x-2 pt-4">
        <button
          @click="close"
          :class="[
            'px-4 py-2 rounded',
            isSubmitting ? 'bg-gray-100 text-gray-400' : 'bg-gray-300',
          ]"
          :disabled="isSubmitting"
        >
          Cancel
        </button>
        <button
          @click="handleExtend"
          class="px-4 py-2 bg-blue-600 text-white rounded flex items-center justify-center"
          :disabled="isSubmitting"
        >
          <svg
            v-if="isSubmitting"
            class="animate-spin h-5 w-5 mr-2 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <span>{{ isSubmitting ? "Extending..." : "Extend" }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  show: Boolean,
  currentEnd: String,
  reservationId: Number,
  errorMessage: String,
  successMessage: String,
});
const emit = defineEmits(["close", "submit"]);

const duration = ref(5);
const isSubmitting = ref(false);

function increaseDuration() {
  if (duration.value < 180) duration.value += 5;
}
function decreaseDuration() {
  if (duration.value > 5) duration.value -= 5;
}

function handleExtend() {
  isSubmitting.value = true;
  emit("submit", {
    reservationId: props.reservationId,
    extendBy: duration.value,
  });
}

function close() {
  emit("close");
}

watch(
  () => [props.successMessage, props.errorMessage],
  ([success, error]) => {
    if (success || error) {
      setTimeout(() => {
        isSubmitting.value = false;
      }, 2000);
    }
  }
);

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
</script>
