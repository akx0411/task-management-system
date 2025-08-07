<template>
  <div class="create-task-wrapper">
    <div class="create-task">
      <h2>Create a Task</h2>

      <div>
        <label>Description:</label>
        <input v-model="taskDescription" placeholder="Enter task description" />
      </div>

      <div>
        <label>Priority:</label>
        <select v-model="priority">
          <option disabled value="">Select priority</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>

      <button @click="addTask">Create Task</button>
    </div>
  </div>
</template>

<script>
import {ref} from "vue";
import {useRouter} from "vue-router";

export default {
  setup() {
    const router = useRouter();
    const taskDescription = ref("");
    const priority = ref("");

    const addTask = async () => {
      if (!taskDescription.value || !priority.value) {
        alert("Please fill all fields");
        return;
      }

      const user = JSON.parse(sessionStorage.getItem("loggedInUser") || "null");
      const newTask = {
        title: taskDescription.value,
        description: taskDescription.value,
        priority: priority.value,
        status: "Pending",
        assignedTo: user ? user.email : null,
        createdAt: Date.now(),
        edited: false,
      };

      await fetch("/fsm/event", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({type: "TASK_EVENT", data: {type: "ADD", task: newTask}}),
      });

      // Reset form
      taskDescription.value = "";
      priority.value = "";

      // Navigate
      router.push("/dashboard/all-tasks");
    };

    return {
      taskDescription,
      priority,
      addTask,
    };
  },
};
</script>

<style scoped>
/* same styling as you provided */
.create-task-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px);
  padding: 20px;
  background-color: #f5f5f5;
}
.create-task {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
}
.create-task label {
  margin-top: 10px;
  font-weight: bold;
}
.create-task input,
.create-task select {
  padding: 10px;
  margin-top: 5px;
  margin-bottom: 15px;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
.create-task button {
  padding: 10px 16px;
  background-color: #002244;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-end;
}
.create-task button:hover {
  background-color: #003366;
}
</style>
