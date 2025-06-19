import { ref } from "vue";
import { useApiFetch } from "@/composables/useApiFetch";

const isLoading = ref(false);
const isError = ref(false);

export function useGateway() {
  async function fetchAll() {
    try {
      isError.value = false;
      isLoading.value = true;
      const response = await useApiFetch("/fetch/all", {
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

  return {
    fetchAll,
  };
}