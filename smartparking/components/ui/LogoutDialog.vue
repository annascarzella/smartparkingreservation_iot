<template>
  <AlertDialog :open="show">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Do you want to log out?</AlertDialogTitle>
      </AlertDialogHeader>

      <div v-if="successMessage" class="text-green-600 mt-2">
        {{ successMessage }}
      </div>

      <AlertDialogFooter v-if="!successMessage">
        <AlertDialogCancel @click="onClose">No</AlertDialogCancel>
        <AlertDialogAction @click="logout">Yes</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup>
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ref } from "vue";

const props = defineProps({
  show: Boolean,
});
const emit = defineEmits(["close"]);

const successMessage = ref("");

function onClose() {
  emit("close");
}

import { useCookie } from "#app";
import { useRouter } from "vue-router";

const cookie = useCookie("access_token");
const router = useRouter();
const logout = () => {
  cookie.value = null;
  successMessage.value = "You have been logged out successfully!";
  // Optionally, redirect to the home page or login page after logout
  setTimeout(() => {
    router.push("/");
  }, 3000); // Close the dialog after 3 seconds
};
</script>
