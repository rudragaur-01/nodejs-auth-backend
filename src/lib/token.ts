import jwt from "jsonwebtoken";
type User = {
  id: string;
  role: "user" | "admin" | "manager";
};

export const createAccessToken = (user: User): string => {
  const payload = {
    sub: user.id,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: "10m",
  });
};

export const createRefreshToken = (user: User): string => {
  const payload = {
    sub: user.id,
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });
};
