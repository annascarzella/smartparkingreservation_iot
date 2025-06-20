import { ref } from "vue";
import { useApiFetch } from "@/composables/useApiFetch";

const isLoading = ref(false);
const isError = ref(false);

export function useReservation() {
  async function createReservation(payload: {
    lockId: number;
    startTime: number;
    endTime: number;
    plateNumber: string;
  }) {
    try {
      isError.value = false;
      isLoading.value = true;
      const response = await useApiFetch("/reservation", {
        method: "POST",
        body: payload,
      });
      return response;
    } catch (error) {
      isError.value = true;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function getCurrentReservation() {
    try {
      isError.value = false;
      isLoading.value = true;
      const response = await useApiFetch("/reservation/getcurrent", {
        method: "GET",
      });
      return response;
    } catch (error) {
      isError.value = true;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function extendReservation(payload: {
    reservationId: number;
    newEndTime: number;
  }) {
    try {
      isError.value = false;
      isLoading.value = true;
      const response = await useApiFetch("/reservation/extend", {
        method: "POST",
        body: payload,
      });
      return response;
    } catch (error) {
      isError.value = true;
      throw error;
    } finally {
      isLoading.value = false;
    }
  }



  return {
    createReservation, 
    getCurrentReservation,
    extendReservation
  };
}