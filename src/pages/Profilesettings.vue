<template>
  <div class="p-6">
    <ProfileSettingsForm v-if="userReady" />
    <div v-else class="text-gray-400">Loading profile...</div>
  </div>
</template>

<script setup>
import ProfileSettingsForm from "@/components/ProfileSettingsForm.vue";
import {useRouter} from "vue-router";
import {onMounted, ref} from "vue";

const router = useRouter();
const userReady = ref(false);

onMounted(() => {
  // Use sessionStorage for user info (set at login)
  const user = JSON.parse(sessionStorage.getItem("loggedInUser") || "null");
  if (!user || !user.email) {
    router.push("/login");
  } else {
    userReady.value = true;
  }
});
</script>
