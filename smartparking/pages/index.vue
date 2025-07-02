<template>
  <div class="p-8 max-w-md mx-auto">
    <h1 class="text-2xl font-bold mb-4">{{ isLogin ? 'Login' : 'Registration' }}</h1>

    <form v-if="!successMessage" @submit.prevent="isLogin ? handleLogin() : handleRegistration()">
      <input
        v-if="!isLogin"
        v-model="name"
        type="text"
        placeholder="Name"
        class="w-full p-2 border mb-2"
      />

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
        class="w-full p-2 border mb-2"
      />

      <input
        v-if="!isLogin"
        v-model="confirmPassword"
        type="password"
        placeholder="Confirm Password"
        class="w-full p-2 border mb-4"
      />

      <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded w-full">
        {{ isLogin ? 'Login' : 'Register' }}
      </button>

      <p class="mt-2 text-center">
        <span v-if="isLogin">Don't have an account?</span>
        <span v-else>Already have an account?</span>
        <button type="button" @click="switchMode" class="text-blue-600 underline ml-1">
          {{ isLogin ? 'Register' : 'Login' }}
        </button>
      </p>
    </form>

    <div v-else class="text-green-600 text-center font-medium text-lg">
      {{ successMessage }}
    </div>

    <p v-if="error" class="text-red-500 mt-2 text-center">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUsers } from "@/composables/useUsers";
import { useCookie } from "#app";

const isLogin = ref(true);
const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const successMessage = ref("");
const res = ref();

const router = useRouter();
const { login, register } = useUsers();

// Switch mode (reset errors and success messages)
const switchMode = () => {
  isLogin.value = !isLogin.value;
  error.value = "";
  successMessage.value = "";
};

// Redirect if already logged in
onMounted(() => {
  if (useCookie("access_token").value) {
    router.push("/map");
  }
});

// Login logic
const loginUser = async () => {
  const payload = { email: email.value, password: password.value };

  try {
    res.value = await login(payload);
    const token = useCookie("access_token", {
      maxAge: 60 * 60 * 5,
      secure: true,
      sameSite: "None",
    });
    token.value = res.value.token;

    successMessage.value = "Login confirmed!";
    error.value = "";
    await new Promise(resolve => setTimeout(resolve, 2000));
    router.push("/map");
  } catch (e) {
    console.error("Login error:", e);
    error.value = e.response?._data?.message || "Login failed.";
  }
};

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = "Email and password are required.";
    return;
  }

  error.value = "";
  await loginUser();
}

// Registration logic
const insertUser = async () => {
  const payload = {
    name: name.value,
    email: email.value,
    password: password.value,
  };

  try {
    res.value = await register(payload);
    successMessage.value = "Registration successful!";
    error.value = "";
    await new Promise(resolve => setTimeout(resolve, 2000));
    password.value = "";
    confirmPassword.value = "";
    isLogin.value = true;
    successMessage.value = "";
  } catch (e) {
    console.error("Registration error:", e);
    error.value = e.response?._data?.message || "Registration failed.";
  }
};

async function handleRegistration() {
  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    error.value = "All fields are required.";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  error.value = "";
  await insertUser();
}

</script>