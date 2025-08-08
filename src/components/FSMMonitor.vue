<template>
  <div v-if="showMonitor" class="fsm-monitor">
    <div class="monitor-header">
      <h4>🔄 FSM State Monitor</h4>
      <button @click="toggleMonitor" class="toggle-btn">
        {{ expanded ? "−" : "+" }}
      </button>
    </div>

    <div v-if="expanded" class="monitor-content">
      <div class="current-state">
        <strong>Current State:</strong>
        <span class="state-badge">{{ currentState }}</span>
      </div>

      <div class="context-section">
        <strong>Context:</strong>
        <pre class="context-display">{{ formatContext(context) }}</pre>
      </div>

      <div class="events-section">
        <strong>Available Events:</strong>
        <div class="events-list">
          <span
            v-for="event in availableEvents"
            :key="event"
            class="event-badge"
            @click="triggerEvent(event)">
            {{ event }}
          </span>
        </div>
      </div>

      <div class="state-history">
        <strong>Recent Transitions:</strong>
        <div class="history-list">
          <div v-for="(transition, index) in stateHistory" :key="index" class="history-item">
            {{ transition }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, getCurrentInstance} from "vue";

const {proxy} = getCurrentInstance();
const fsm = proxy?.$fsm;

const showMonitor = ref(process.env.NODE_ENV === "development");
const expanded = ref(false);
const currentState = ref("unknown");
const context = ref({});
const availableEvents = ref([]);
const stateHistory = ref([]);

const toggleMonitor = () => {
  expanded.value = !expanded.value;
};

const formatContext = (ctx) => {
  return JSON.stringify(ctx, null, 2);
};

const triggerEvent = (eventName) => {
  if (fsm && eventName) {
    console.log(`🎮 Triggering FSM event: ${eventName}`);
    fsm.send(eventName);
  }
};

const updateState = (state) => {
  currentState.value = typeof state.value === "object" ? Object.keys(state.value)[0] : state.value;

  context.value = state.context;
  availableEvents.value = Object.keys(state.nextEvents || {});

  // Add to history
  const transition = `${state.event?.type || "INIT"} → ${currentState.value}`;
  stateHistory.value.unshift(transition);
  if (stateHistory.value.length > 5) {
    stateHistory.value = stateHistory.value.slice(0, 5);
  }
};

onMounted(() => {
  if (fsm) {
    // Get initial state
    updateState(fsm.state);

    // Subscribe to changes
    fsm.onTransition((state) => {
      updateState(state);
    });
  }
});
</script>

<style scoped>
.fsm-monitor {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 8px;
  min-width: 300px;
  max-width: 400px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px 8px 0 0;
}

.monitor-header h4 {
  margin: 0;
  font-size: 14px;
}

.toggle-btn {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.monitor-content {
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.current-state {
  margin-bottom: 15px;
}

.state-badge {
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.context-section {
  margin-bottom: 15px;
}

.context-display {
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  border-radius: 4px;
  font-size: 10px;
  max-height: 100px;
  overflow-y: auto;
  margin: 5px 0;
}

.events-section {
  margin-bottom: 15px;
}

.events-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}

.event-badge {
  background: #28a745;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.event-badge:hover {
  background: #218838;
}

.state-history {
  margin-bottom: 15px;
}

.history-list {
  margin-top: 5px;
}

.history-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  border-radius: 3px;
  margin-bottom: 2px;
  font-size: 10px;
  opacity: 0.8;
}

/* Hide in production */
@media (max-width: 768px) {
  .fsm-monitor {
    display: none;
  }
}
</style>
