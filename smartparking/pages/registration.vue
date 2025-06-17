<template>
  <div class="p-8 max-w-md mx-auto">
    <h1 class="text-2xl font-bold mb-4">Registration</h1>

    <form @submit.prevent="handleRegistration">
      <input
        v-model="name"
        type="text"
        placeholder="Name"
        class="w-full p-2 border mb-2"
      />
      <input
        v-model="email"
        type="email"
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
        Register
      </button>
    </form>

    <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

import { useUsers } from "@/composables/useUsers";

const email = ref("");
const name = ref("");
const password = ref("");
const error = ref("");
const router = useRouter();

//
const res = ref();

const { register } = useUsers();

const insertUser = async () => {
  const payload = {
    name: name.value,
    email: email.value,
    password: password.value,
  };
  console.log("Payload for submission:", payload);

  try {
    res.value = await register(payload);
    console.log("Registration response:", res);

    router.push("/login");
  } catch (e) {
    console.error("Error fetching:", e.response);
    error.value =
      e.response?._data?.message || "An error occurred during registration.";
  }
};

function handleRegistration() {
  if (!name.value || !email.value || !password.value) {
    error.value = "Name, Email and password are required.";
    return;
  }

  error.value = ""; // Clear previous errors
  insertUser();
}
</script>
