<template>
  <div>
    <Button> ciao </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { onMounted } from "#imports";
import { useCookie } from "#imports";
import { useRouter } from "#imports";

const router = useRouter();

onMounted(() => {
  // Check if the access token exists in cookies
  if (!useCookie("access_token").value) {
    console.error("No access token found in cookies.");
    router.push("/login"); // Redirect to login page
  } else {
    console.log("JWT from cookie:", useCookie("access_token").value);
  }
});
</script>
