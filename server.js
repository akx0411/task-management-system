// server.js
// Express server setup for XState FSM integration

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import fsmRoutes from "./routes/fsm.js";

const app = express();
app.use(cors());
app.use(express.json({limit: "5mb"}));

app.use("/auth", authRoutes);
app.use("/fsm", fsmRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
