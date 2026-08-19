import bcrypt from "bcryptjs";
import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";

/*
|--------------------------------------------------------------------------
| JWT Secret
|--------------------------------------------------------------------------
*/

const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-development-key";

/*
|--------------------------------------------------------------------------
| JWT Payload
|--------------------------------------------------------------------------
*/

export interface AuthTokenPayload {
  userId: string;
}

/*
|--------------------------------------------------------------------------
| Hash Password
|--------------------------------------------------------------------------
*/

export async function hashPassword(
  password: string
): Promise<string> {
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
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/*
|--------------------------------------------------------------------------
| Create JWT
|--------------------------------------------------------------------------
*/

export function generateToken(userId: string): string {
  return jwt.sign(
    {
      userId,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
      algorithm: "HS256",
    }
  );
}

/*
|--------------------------------------------------------------------------
| Verify JWT
|--------------------------------------------------------------------------
*/

export function verifyToken(
  token: string
): AuthTokenPayload {
  const payload = jwt.verify(token, JWT_SECRET, {
    algorithms: ["HS256"],
  });

  if (
    typeof payload === "string" ||
    !payload.userId ||
    typeof payload.userId !== "string"
  ) {
    throw new JsonWebTokenError(
      "Invalid authentication token payload"
    );
  }

  return {
    userId: payload.userId,
  };
}

/*
|--------------------------------------------------------------------------
| Get User ID From JWT
|--------------------------------------------------------------------------
*/

export function getUserIdFromToken(
  token: string
): string | null {
  try {
    const payload = verifyToken(token);

    return payload.userId;
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Check Whether Token Is Expired
|--------------------------------------------------------------------------
*/

export function isTokenExpired(token: string): boolean {
  try {
    verifyToken(token);

    return false;
  } catch (error) {
    return error instanceof TokenExpiredError;
  }
}

/*
|--------------------------------------------------------------------------
| Safely Read Authentication Token
|--------------------------------------------------------------------------
*/

export function getAuthTokenPayload(
  token: string
): AuthTokenPayload | null {
  try {
    return verifyToken(token);
  } catch (error) {
    if (
      error instanceof TokenExpiredError ||
      error instanceof JsonWebTokenError
    ) {
      return null;
    }

    return null;
  }
}