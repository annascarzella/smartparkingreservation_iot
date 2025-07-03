<template>
  <AlertDialog :open="show">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle
          >Have you reached your parking space?</AlertDialogTitle
        >
      </AlertDialogHeader>

      <div v-if="successMessage" class="text-green-600 mt-2">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="text-red-600 mt-2">
        {{ errorMessage }}
      </div>

      <AlertDialogFooter v-if="!successMessage">
        <AlertDialogCancel @click="onClose" :disabled="isSubmitting"
          >No</AlertDialogCancel
        >
        <AlertDialogAction @click="handleConfirm" :disabled="isSubmitting">
          <template v-if="isSubmitting">
            <svg
              class="animate-spin h-5 w-5 mr-2 inline text-white"
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
            <span>Confirming...</span>
          </template>
          <template v-else> Yes </template>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup>
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ref } from "vue";
import { useReservation } from "@/composables/useReservation";

const props = defineProps({
  show: Boolean,
  reservationId: {
    type: Number,
    required: true,
  },
});
const emit = defineEmits(["close"]);

const { notifyArrival } = useReservation();

const errorMessage = ref("");
const successMessage = ref("");
const isSubmitting = ref(false);

function onClose() {
  resetState();
  emit("close");
}

async function handleConfirm() {
  errorMessage.value = "";
  successMessage.value = "";
  isSubmitting.value = true;

  try {
    await notifyArrival({ reservationId: props.reservationId });
    successMessage.value = "Arrival successfully notified!";
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 2000);
  } catch (e) {
    errorMessage.value =
      e.response?._data?.message || "Error occurred while notifying arrival.";
  } finally {
    setTimeout(() => {
      isSubmitting.value = false;
    }, 2000);
  }
}

function resetState() {
  errorMessage.value = "";
  successMessage.value = "";
  isSubmitting.value = false;
}
</script>
