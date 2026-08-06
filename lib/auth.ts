import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-development-key";

/*
|--------------------------------------------------------------------------
| Hash Password
|--------------------------------------------------------------------------
*/

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

/*
|--------------------------------------------------------------------------
| Compare Password
|--------------------------------------------------------------------------
*/

export async function verifyPassword(
  password: string,
  hash: string
) {
  return bcrypt.compare(password, hash);
}

/*
|--------------------------------------------------------------------------
| Create JWT
|--------------------------------------------------------------------------
*/

export function generateToken(userId: string) {
  return jwt.sign(
    {
      userId,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

/*
|--------------------------------------------------------------------------
| Verify JWT
|--------------------------------------------------------------------------
*/

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as {
    userId: string;
  };
}
export function getUserIdFromToken(token: string) {
  try {
    const payload = verifyToken(token);

    return payload.userId;
  } catch {
    return null;
  }
}