import { ref } from "vue";
import { useApiFetch } from "@/composables/useApiFetch";

const isLoading = ref(false);
const isError = ref(false);

export function useUsers() {
  async function login(payload: { email: string; password: string }) {
    try {
      // await ensureAuthenticated();
      isError.value = false;
      isLoading.value = true;
      const response = await useApiFetch("/login", {
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
  async function register(payload: {
    name: string;
    email: string;
    password: string;
  }) {
    try {
      isError.value = false;
      isLoading.value = true;
      const response = await useApiFetch("/register", {
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
    login,
    register,
  };
}
