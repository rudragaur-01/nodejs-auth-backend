import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./modules/auth/auth.routes";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Server is running",
  });
});

app.use('/auth',authRouter)

export default app;