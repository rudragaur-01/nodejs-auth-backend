import { RequestHandler } from "express";
import { loginSchema, registerSchema } from "./auth.validation";
import { getUser, loginUser, registerUser, verifyEmail } from "./auth.service";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../../lib/token";

export const registerController: RequestHandler = async (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid data",
      errors: result.error.flatten(),
    });
  }
  try {
    const { newUser } = await registerUser(result.data);
    return res.status(201).json({
      message: "User registered successfully",
      newUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const verifyEmailController: RequestHandler = async (req, res) => {
  const token = req.query.token as string | undefined;

  if (!token) {
    return res.status(400).json({
      message: "Verification token is required",
    });
  }
  try {
    await verifyEmail(token);
    return res.status(200).json({ message: "Email verification successful" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const loginController: RequestHandler = async (req, res) => {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid data",
      errors: result.error.flatten(),
    });
  }
  try {
    const { user, accessToken, refreshToken } = await loginUser(result.data);
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.is_email_verified,
      },
      accessToken,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const refreshController: RequestHandler = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        message: "Refresh token is required",
      });
    }

    const payload = verifyRefreshToken(token);
    const user = await getUser(payload);

    if (!user) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "Token refreshed successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.is_email_verified,
      },
      accessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    return res.status(401).json({
      message: "Invalid or expired refresh token",
    });
  }
};

export const logoutController: RequestHandler = async (req, res) => {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    message: "Logout successful",
  });
};

export const forgotPasswordController: RequestHandler = async (req, res) => {};

export const resetPasswordController: RequestHandler = async (req, res) => {};
