<template>
  <div class="bg-white rounded-2xl shadow-md p-6 space-y-4 border mt-3">
    <h2 class="text-2xl font-semibold text-center text-gray-800">
      Active Reservation
    </h2>

    <div
      class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center text-gray-700"
    >
      <p class="sm:col-span-2">
        <strong>Plate Number:</strong>
        {{ reservation.plate_number }}
      </p>
      <p class="sm:col-span-2">
        <strong>Expires in </strong>
        <span :class="timeClass"
          ><template v-if="minutesRemaining < 1"> less than a minute</template>
          <template v-else>
            {{ minutesRemaining }} minute<template v-if="minutesRemaining > 1"
              >s</template
            ></template
          >
        </span>
      </p>
    </div>

    <div class="flex flex-wrap gap-3 justify-center pt-4">
      <button
        @click="showExtendDialog = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
      >
        Extend
      </button>

      <button
        @click="showNotifyDialog = true"
        class="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
      >
        Arrived?
      </button>

      <button
        @click="openGoogleMaps"
        class="px-4 py-2 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-900 transition"
      >
        <MapPin class="w-6 h-6" />
      </button>
    </div>

    <div v-if="error" class="text-red-500 text-center">{{ error }}</div>
    <div v-if="success" class="text-green-600 text-center">{{ success }}</div>
  </div>
  <NotifyArrivalDialog
    :show="showNotifyDialog"
    :reservationId="reservation?.id"
    @close="showNotifyDialog = false"
  />

  <ExtendDialog
    :show="showExtendDialog"
    :currentEnd="reservation?.end_time"
    :reservationId="reservation?.id"
    :errorMessage="extendError"
    :successMessage="extendSuccess"
    @close="showExtendDialog = false"
    @submit="handleExtendSubmit"
  />
  <ReservationExpiredDialog :show="showExpiredDialog" />
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, onUnmounted } from "vue";
import ReservationExpiredDialog from "@/components/ui/ReservationExpiredDialog.vue";
import ExtendDialog from "@/components/ui/ExtendDialog.vue";
import NotifyArrivalDialog from "@/components/ui/NotifyArrivalDialog.vue";
import { useReservation } from "@/composables/useReservation";
import { MapPin } from "lucide-vue-next";

const props = defineProps({
  reservation: Object,
  error: String,
  success: String,
  locks: Array,
});

const showExpiredDialog = ref(false);
let expirationTimeout = null;
const showNotifyDialog = ref(false);
const showExtendDialog = ref(false);
const extendError = ref("");
const extendSuccess = ref("");

const { extendReservation } = useReservation();

onUnmounted(() => {
  if (expirationTimeout) clearTimeout(expirationTimeout);
});

const emit = defineEmits(["extend", "notify"]);

const minutesRemaining = ref(
  Math.round((new Date(props.reservation.end_time) - new Date()) / 60000)
);

let intervalId = null;
onMounted(() => {
  scheduleExpirationCheck(props.reservation.end_time);
  console.log("Current Reservation:", props.reservation);
  intervalId = setInterval(() => {
    minutesRemaining.value = Math.max(
      0,
      Math.round((new Date(props.reservation.end_time) - new Date()) / 60000)
    );
  }, 45000); // 45 seconds
});

onBeforeUnmount(() => {
  clearInterval(intervalId);
});

const timeClass = computed(() => {
  return minutesRemaining.value < 5
    ? "text-red-600 font-semibold"
    : "text-gray-800";
});

function openGoogleMaps() {
  const lock = props.locks?.find(
    (lock) => lock.id === props.reservation?.lock_id
  );
  if (lock) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lock.latitude},${lock.longitude}`;
    window.open(url, "_blank");
  } else {
    console.warn("No reserved lock found.");
  }
}

async function handleExtendSubmit({ reservationId, extendBy }) {
  extendError.value = "";
  extendSuccess.value = "";
  const newEndTime = new Date(
    new Date(props.reservation.end_time).getTime() + extendBy * 60000
  );
  try {
    await extendReservation({
      reservationId,
      newEndTime,
    });
    extendSuccess.value = "Reservation extended successfully!";
    setTimeout(() => window.location.reload(), 2000);
  } catch (e) {
    extendError.value = e.response?._data?.message || "Failed to extend.";
    setTimeout(() => {
      extendError.value = "";
    }, 2000);
  }
  props.reservation.end_time = newEndTime;
  scheduleExpirationCheck(newEndTime);
  extendSuccess.value = "Reservation extended successfully!";
}

function scheduleExpirationCheck(endTime) {
  if (expirationTimeout) clearTimeout(expirationTimeout);

  const msRemaining = new Date(endTime) - new Date();

  if (msRemaining > 0) {
    expirationTimeout = setTimeout(() => {
      showExpiredDialog.value = true;
      setTimeout(() => window.location.reload(), 4000);
    }, msRemaining);
  }
}
</script>
