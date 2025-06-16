<template>
    <div class="p-8 max-w-md mx-auto">
      <h1 class="text-2xl font-bold mb-4">Login</h1>
  
      <form @submit.prevent="handleLogin">
        <input
          v-model="email"
          type="text"
          placeholder="email"
          class="w-full p-2 border mb-2"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          class="w-full p-2 border mb-4"
        />
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">
          Login
        </button>
      </form>
  
      <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'

  import { useUsers } from "@/composables/useUsers";

  const email = ref('')
  const password = ref('')
  const error = ref('')
  const router = useRouter()

  //
  const res = ref();
  const isLoading = ref(true);
  const errorMessage = ref("");

  const { login } = useUsers();

  const loginUser = async () => {
    const payload = {
      email: email.value,
      password: password.value
    };
    console.log("Payload for submission:", payload);

    try {
        res.value = await login(payload);
        console.log("Response from login:", res.value);
        console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    } catch (error) {
        console.error("Error fetching:", error);
        if (error.response?.status === 403) {
            errorMessage.value =
            "Access to this page is blocked. You must be authenticated.";
        } else {
            errorMessage.value = "Error fetching. Please try again later.";
        }
    } finally {
        isLoading.value = false; // Stop loading after data is fetched or an error occurs
    }
  };
  
  function handleLogin() {
    if (!email.value || !password.value) {
      error.value = "Email and password are required.";
      return;
    }
    
    error.value = ""; // Clear previous errors
    loginUser()
      .then(() => {
        router.push("/ciao"); // Redirect to dashboard on success
      })
      .catch(err => {
        error.value = err.message || "Login failed. Please try again.";
      });
  }
  </script>