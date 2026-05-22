import express from "express";
import http from "http";
import { ENV } from "./config/env.config.js";
import { connectDB } from "./config/db.config.js";
import { Server } from "socket.io";
import cors from "cors";
import { connectToSocket } from "./controllers/socketManager.controller.js";
import AuthRoutes from "./routes/users.routes.js";

const app = express();
app.set("port", ENV.PORT);
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

const server = http.createServer(app);
const io = connectToSocket(server);

app.use("/api/auth", AuthRoutes);

const start = async () => {
  server.listen(app.get("port"), () => {
    connectDB();
    console.log(`App is listen on the port ${ENV.PORT}`);
  });
};

start();
