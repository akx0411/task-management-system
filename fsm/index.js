// fsm/index.js
import {interpret} from "xstate";
import {mainMachine} from "./mainMachine.js";
import {createStateLogger, logStateStructure} from "./stateLogger.js";

// Log machine structure (development only)
if (process.env.NODE_ENV !== "production") {
  logStateStructure(mainMachine);
}

// Create service for backend (XState v4 API)
const mainService = interpret(
  mainMachine.withContext({
    user: null,
    tasks: [],
    users: [],
    currentTask: null,
    error: null,
  })
);

// Add state logging in development (before starting)
if (process.env.NODE_ENV !== "production") {
  createStateLogger(mainService);
}

// Start the service
mainService.start();

export {mainService};
