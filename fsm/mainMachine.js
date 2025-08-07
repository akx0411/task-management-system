// fsm/mainMachine.js
import {createMachine, assign} from "xstate";

const mainMachine = createMachine({
  id: "taskManagement",
  initial: "signup",
  predictableActionArguments: true,
  context: {
    user: null,
    tasks: [],
    users: [],
    currentTask: null,
    error: null,
  },
  states: {
    signup: {
      on: {
        SIGNUP_SUCCESS: {
          target: "login",
          actions: assign({
            user: (context, event) => event.user,
            error: null,
          }),
        },
        SIGNUP_ERROR: {
          actions: assign({
            error: (context, event) => event.error,
          }),
        },
        LOGIN_SUCCESS: {
          target: "dashboard",
          actions: assign({
            user: (context, event) => event.user,
            error: null,
          }),
        },
        LOGIN_ERROR: {
          actions: assign({
            error: (context, event) => event.error,
          }),
        },
        GO_TO_LOGIN: "login",
      },
    },
    login: {
      on: {
        LOGIN_SUCCESS: {
          target: "dashboard",
          actions: assign({
            user: (context, event) => event.user,
            error: null,
          }),
        },
        LOGIN_ERROR: {
          actions: assign({
            error: (context, event) => event.error,
          }),
        },
        GO_TO_SIGNUP: "signup",
      },
    },
    dashboard: {
      initial: "idle",
      states: {
        idle: {},
        loading: {},
      },
      on: {
        GO_TO_ASSIGN_TASK: "assignTask",
        GO_TO_PENDING_TASKS: "pendingTasks",
        GO_TO_COMPLETED_TASKS: "completedTasks",
        GO_TO_PROFILE_SETTINGS: "profileSettings",
        LOAD_TASKS: {
          actions: assign({
            tasks: (context, event) => event.tasks,
          }),
        },
        LOAD_USERS: {
          actions: assign({
            users: (context, event) => event.users,
          }),
        },
        LOGOUT: {
          target: "login",
          actions: assign({
            user: null,
            tasks: [],
            users: [],
            currentTask: null,
            error: null,
          }),
        },
      },
    },
    assignTask: {
      on: {
        SUBMIT_TASK: {
          actions: assign({
            tasks: (context, event) => [...context.tasks, event.task],
            currentTask: null,
          }),
        },
        TASK_ERROR: {
          actions: assign({
            error: (context, event) => event.error,
          }),
        },
        GO_TO_DASHBOARD: "dashboard",
        GO_TO_PENDING_TASKS: "pendingTasks",
        GO_TO_COMPLETED_TASKS: "completedTasks",
        GO_TO_PROFILE_SETTINGS: "profileSettings",
      },
    },
    pendingTasks: {
      on: {
        EDIT_TASK: {
          actions: assign({
            currentTask: (context, event) => event.task,
          }),
        },
        DELETE_TASK: {
          actions: assign({
            tasks: (context, event) => context.tasks.filter((task) => task.id !== event.taskId),
          }),
        },
        UPDATE_TASK_STATUS_SUCCESS: {
          actions: assign({
            tasks: (context, event) =>
              context.tasks.map((task) =>
                task.title === event.taskTitle
                  ? {
                      ...task,
                      status: event.newStatus === "inProgress" ? "In Progress" : event.newStatus,
                      edited: true,
                    }
                  : task
              ),
          }),
        },
        UPDATE_TASK_STATUS_ERROR: {
          actions: assign({
            error: (context, event) => event.error,
          }),
        },
        MARK_AS_COMPLETED: {
          actions: assign({
            tasks: (context, event) =>
              context.tasks.map((task) =>
                task.id === event.taskId ? {...task, status: "Completed"} : task
              ),
          }),
        },
        GO_TO_DASHBOARD: "dashboard",
        GO_TO_ASSIGN_TASK: "assignTask",
        GO_TO_COMPLETED_TASKS: "completedTasks",
        GO_TO_PROFILE_SETTINGS: "profileSettings",
      },
    },
    completedTasks: {
      on: {
        DELETE_TASK: {
          actions: assign({
            tasks: (context, event) => context.tasks.filter((task) => task.id !== event.taskId),
          }),
        },
        UPDATE_TASK_STATUS_SUCCESS: {
          actions: assign({
            tasks: (context, event) =>
              context.tasks.map((task) =>
                task.title === event.taskTitle
                  ? {
                      ...task,
                      status: event.newStatus === "inProgress" ? "In Progress" : event.newStatus,
                      edited: true,
                    }
                  : task
              ),
          }),
        },
        UPDATE_TASK_STATUS_ERROR: {
          actions: assign({
            error: (context, event) => event.error,
          }),
        },
        GO_TO_DASHBOARD: "dashboard",
        GO_TO_ASSIGN_TASK: "assignTask",
        GO_TO_PENDING_TASKS: "pendingTasks",
        GO_TO_PROFILE_SETTINGS: "profileSettings",
      },
    },
    profileSettings: {
      on: {
        SAVE_PROFILE: {
          actions: assign({
            user: (context, event) => ({...context.user, ...event.profileData}),
          }),
        },
        GO_TO_DASHBOARD: "dashboard",
        GO_TO_ASSIGN_TASK: "assignTask",
        GO_TO_PENDING_TASKS: "pendingTasks",
        GO_TO_COMPLETED_TASKS: "completedTasks",
      },
    },
  },
});

export {mainMachine};
