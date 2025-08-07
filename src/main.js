// src/main.js
import {createApp} from "vue";
import App from "./App.vue";
import router from "./router";
import {fsmService} from "@/services/fsmService.js";

const app = createApp(App);

// Make FSM service available globally
app.config.globalProperties.$fsm = fsmService;

app.use(router).mount("#app");
