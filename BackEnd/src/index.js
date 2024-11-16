import express from "express";
import {createServer} from "node:http";

import {Server} from "socket.io";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";


import cors from "cors";
import { connect } from "node:http2";

import userRoutes from "./routes/usersRoutes.js";


const app = express();
const server = createServer(app);
const io = connectToSocket(server);
const port = 8080;


app.set("port", (process.env.PORT || 8080));
app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit: "40kb", extended: true}));

app.use("/api/v1/users", userRoutes);

const start = async () => {
    const connectionDb = await mongoose.connect("mongodb+srv://alphastudent87:AlphaStudent87ApnaCollege@cluster0.cb1kx.mongodb.net/");

    console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);

server.listen(app.get("port"), (req, res) => {
    console.log(`App is Listing on Port ${port}`);
});

}

start();