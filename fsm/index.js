// fsm/index.js
import {interpret} from "xstate";
import {mainMachine} from "./mainMachine.js";

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

// Start the service
mainService.start();

export {mainService};
