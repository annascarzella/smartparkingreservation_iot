<template>
  <div class="p-8 max-w-md mx-auto">
    <h1 class="text-2xl font-bold mb-4">Login</h1>

    <form @submit.prevent="handleLogin">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
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
import { ref } from "vue";
import { useRouter } from "vue-router";

import { useUsers } from "@/composables/useUsers";
import { useCookie } from "#app";

const email = ref("");
const password = ref("");
const error = ref("");
const router = useRouter();

const res = ref();
const { login } = useUsers();

const loginUser = async () => {
  const payload = {
    email: email.value,
    password: password.value,
  };
  console.log("Payload for submission:", payload);

  try {
    res.value = await login(payload);

    const token = useCookie("access_token", {
      maxAge: 60 * 60 * 5, // 5 hours
      secure: true,
      sameSite: "None",
    });
    token.value = res.value.token;

    router.push("/ciao");
  } catch (e) {
    console.error("Error fetching:", e);
    error.value =
      e.response?._data?.message || "An error occurred during registration.";
  }
};

function handleLogin() {
  if (!email.value || !password.value) {
    error.value = "Email and password are required.";
    return;
  }

  error.value = ""; // Clear previous errors
  loginUser();
}
</script>
