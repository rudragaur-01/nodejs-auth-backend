import argon2 from "argon2";
import pool from "../../config/db";
import { LoginInput, RegisterInput } from "./auth.validation";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../lib/mailer";
import { createAccessToken, createRefreshToken } from "../../lib/token";

function getAppUrl() {
  return process.env.APP_URL || `http://localhost:${process.env.PORT}`;
}

export async function registerUser(data: RegisterInput) {
  const { name, email, password, phoneNumber } = data;

  const existingUser = await pool.query(
    `
    SELECT id
    FROM users
    WHERE email = $1 OR phone_number = $2
    LIMIT 1
    `,
    [email, phoneNumber],
  );

  if (existingUser.rowCount && existingUser.rowCount > 0) {
    throw new Error("Email or phone number is already registered");
  }

  const passwordHash = await argon2.hash(password);

  const result = await pool.query(
    `
  INSERT INTO users (
    name,
    organization_id,
    email,
    phone_number,
    password_hash
  )
  VALUES ($1, $2, $3, $4, $5)
  RETURNING id, name, email, phone_number, role, is_email_verified
  `,
    [
      name,
      "34dda6a6-34c7-4ca9-971d-794da8ec1114",
      email,
      phoneNumber,
      passwordHash,
    ],
  );

  const newUser = result.rows[0];

  const verifyToken = jwt.sign(
    { sub: newUser.id },
    process.env.JWT_ACCESS_SECRET!,
    {
      expiresIn: "15m",
    },
  );

  const verifyUrl = `${getAppUrl()}/auth/verify-email?token=${verifyToken}`;

  await sendEmail(
    newUser.email,
    "Verify Your Email",
    `
    <p>Hello ${newUser.name},</p>
    <p>Click the link below to verify your email:</p>
    <a href="${verifyUrl}">Verify Email</a>
    <p>This link expires in 15 minutes.</p>
  `,
  );

  return {
    newUser,
  };
}

export async function verifyEmail(token: string) {
  const payload = (await jwt.verify(token, process.env.JWT_ACCESS_SECRET!)) as {
    sub: string;
  };

  if (typeof payload === "string" || !payload.sub) {
    throw new Error("Invalid verification token");
  }

  const result = await pool.query(
    `
        UPDATE users 
        SET is_email_verified = TRUE,
            email_verification_token = NULL,
            email_verification_token_expires_at = NULL,
            updated_at = NOW()
        WHERE id = $1
        AND is_email_verified = FALSE
        RETURNING id,name,email


        `,
    [payload.sub],
  );
  if (result.rows.length === 0) {
    throw new Error("User not found or email already verified");
  }

  return result.rows[0];
}

export async function loginUser(data: LoginInput) {
  const { email, password } = data;

  const result = await pool.query(
    `
    SELECT * FROM users
    WHERE email = $1
    `,
    [email],
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.is_email_verified === false) {
    throw new Error("Please verify your email");
  }

  const isPasswordValid = await argon2.verify(user.password_hash, password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  const isProd = process.env.NODE_ENV;
  return { user, accessToken, refreshToken };
}
