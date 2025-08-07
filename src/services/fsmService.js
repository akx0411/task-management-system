import {interpret} from "xstate";
import {mainMachine} from "../../fsm/mainMachine.js";

console.log("Loading frontend FSM service...");

// Create a new service for frontend (XState v4 API)
const fsmService = interpret(
  mainMachine.withContext({
    user: null,
    tasks: [],
    users: [],
    currentTask: null,
    error: null,
  })
);

// Subscribe to state changes
fsmService.onTransition((state) => {
  console.log("Frontend FSM state transition:", state.value);
  console.log("Frontend FSM context:", state.context);
});

// Start the service
fsmService.start();

console.log("Frontend FSM service loaded successfully");

export {fsmService};
