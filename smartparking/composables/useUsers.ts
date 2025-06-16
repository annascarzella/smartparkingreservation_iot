import { ref, computed } from "vue";
import { useApiFetch } from "@/composables/useApiFetch";

const isLoading = ref(false);
const isError = ref(false);

export function useUsers() {
    async function login() {
        try {
          // await ensureAuthenticated();
          isError.value = false;
          isLoading.value = true;
          const response = await useApiFetch("/login", {
            method: "POST",
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
        login,
    };
}
    