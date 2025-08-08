// fsm/stateLogger.js
export const createStateLogger = (service) => {
  // Check if service is initialized
  if (!service.state) {
    console.log("⚠️ Service not yet initialized, setting up logger...");

    // Wait for service to start and then log initial state
    service.onTransition((state, event) => {
      if (event.type === "xstate.init") {
        console.log("🚀 FSM Service Started");
        console.log("📍 Initial State:", state.value);
        console.log("📦 Initial Context:", state.context);
      }
    });
  } else {
    // Service is already started
    console.log("🚀 FSM Service Started");
    console.log("📍 Initial State:", service.state.value);
    console.log("📦 Initial Context:", service.state.context);
  }

  // Subscribe to state changes
  service.onTransition((state) => {
    console.group(`🔄 State Transition: ${JSON.stringify(state.value)}`);
    console.log("🏃‍♂️ Previous State:", state.history?.value || "none");
    console.log("🎯 Current State:", state.value);
    console.log("📦 Context:", state.context);
    console.log("⚡ Event:", state.event);
    console.log("🔍 Changed:", state.changed);
    console.groupEnd();

    // Visual state indicator in console
    const stateEmojis = {
      signup: "🚀",
      login: "🔐",
      dashboard: "📊",
      assignTask: "📝",
      pendingTasks: "⏳",
      completedTasks: "✅",
      profileSettings: "👤",
    };

    const currentState =
      typeof state.value === "object" ? Object.keys(state.value)[0] : state.value;

    console.log(`${stateEmojis[currentState] || "🔄"} Current State: ${currentState}`);
  });

  // Log available transitions
  service.onTransition((state) => {
    const availableEvents = Object.keys(state.nextEvents || {});
    if (availableEvents.length > 0) {
      console.log("🎮 Available Events:", availableEvents);
    }
  });

  return service;
};

// Helper function to visualize state structure
export const logStateStructure = (machine) => {
  console.group("🏗️ FSM Structure");
  console.log("🎯 Machine ID:", machine.id);
  console.log("🚀 Initial State:", machine.initial);
  console.log("📋 States:", Object.keys(machine.states || {}));

  // Log each state's transitions
  Object.entries(machine.states || {}).forEach(([stateName, stateConfig]) => {
    console.group(`📍 State: ${stateName}`);
    if (stateConfig.on) {
      console.log("⚡ Events:", Object.keys(stateConfig.on));
    }
    if (stateConfig.states) {
      console.log("🔗 Nested States:", Object.keys(stateConfig.states));
    }
    console.groupEnd();
  });

  console.groupEnd();
};
