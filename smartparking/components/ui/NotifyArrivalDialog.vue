<template>
  <AlertDialog :open="show">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Have you reached your parking space?</AlertDialogTitle>
      </AlertDialogHeader>

      <div v-if="successMessage" class="text-green-600 mt-2">{{ successMessage }}</div>
      <div v-if="errorMessage" class="text-red-600 mt-2">{{ errorMessage }}</div>

      <AlertDialogFooter v-if="!successMessage">
        <AlertDialogCancel @click="onClose">No</AlertDialogCancel>
        <AlertDialogAction @click="handleConfirm">Yes</AlertDialogAction>
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
} from '@/components/ui/alert-dialog'

import { ref } from 'vue'
import { useReservation } from '@/composables/useReservation'

const props = defineProps({
  show: Boolean,
  reservationId: {
    type: Number,
    required: true,
  },
})
const emit = defineEmits(['close'])

const { notifyArrival } = useReservation()

const errorMessage = ref('')
const successMessage = ref('')

function onClose() {
  resetState()
  emit('close')
}

async function handleConfirm() {
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await notifyArrival({ reservationId: props.reservationId })
    successMessage.value = 'Arrival successfully notified!'
    setTimeout(() => {
      onClose()
      window.location.reload()
    }, 2000)
  } catch (e) {
    errorMessage.value =
      e.response?._data?.message || 'Error occurred while notifying arrival.'
  }
}

function resetState() {
  errorMessage.value = ''
  successMessage.value = ''
}
</script>
