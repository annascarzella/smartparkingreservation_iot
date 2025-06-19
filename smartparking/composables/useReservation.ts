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

  return {
    createReservation,
  };
}