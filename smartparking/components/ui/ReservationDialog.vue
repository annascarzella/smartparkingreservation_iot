<template>
  <div
    v-if="show"
    class="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.5)] z-50 px-5"
  >
    <div class="bg-white rounded-lg shadow-xl p-6 w-96">
      <h2 class="text-xl font-semibold mb-4">Reserve Slot</h2>
      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label for="plate" class="block text-sm font-medium"
            >Plate Number</label
          >
          <input
            v-model="plate"
            id="plate"
            type="text"
            required
            class="w-full border rounded px-3 py-2 mt-1"
          />
        </div>
        <div class="mb-4">
          <label for="duration" class="block text-sm font-medium mb-1"
            >Duration</label
          >
          <div class="flex space-x-2">
            <button
              type="button"
              @click="decreaseDuration"
              class="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              :disabled="duration <= 5"
            >
              −
            </button>

            <input
              id="duration"
              type="number"
              v-model.number="duration"
              class="border rounded px-3 py-2 text-center"
              min="5"
              max="180"
              step="5"
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

            <span class="text-gray-600 px-3 py-2">minutes</span>
          </div>
        </div>

        <div class="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 bg-gray-300 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Reserve
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  show: Boolean,
  lockId: [String, Number],
});

const emit = defineEmits(["close", "submit"]);

const plate = ref("");
const duration = ref(5);

function close() {
  emit("close");
  plate.value = "";
  duration.value = 5;
}

function handleSubmit() {
  if (duration.value > 180 || duration.value < 5) {
    alert("Reservation must be between 5 and 180 minutes.");
    return;
  }

  emit("submit", {
    lockId: props.lockId,
    plate: plate.value,
    duration: duration.value, // in minutes now
  });

  close();
}

function increaseDuration() {
  if (duration.value < 180) {
    duration.value += 5;
  }
}

function decreaseDuration() {
  if (duration.value > 5) {
    duration.value -= 5;
  }
}
</script>
