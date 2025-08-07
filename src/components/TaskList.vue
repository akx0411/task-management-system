<!-- src/components/TaskList.vue -->
<template>
  <ul class="space-y-2">
    <li
      v-for="task in tasks"
      :key="task.id"
      class="flex justify-between items-center bg-white text-black px-4 py-2 rounded shadow"
    >
      <span>{{ task.text }}</span>
      <button
        @click="() => send({ type: 'DELETE_TASK', id: task.id })"
        class="text-red-600 hover:text-red-800"
      >
        Delete
      </button>
    </li>
  </ul>
</template>

<script setup>
const props = defineProps({
  tasks: Array,
  send: Function
});
</script>
