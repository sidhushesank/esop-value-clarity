import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import jwt, {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";

/*
|--------------------------------------------------------------------------
| JWT Secret
|--------------------------------------------------------------------------
| In production the app refuses to sign or verify anything without a real
| secret. The old hard-coded fallback meant anyone who read the source could
| forge a login for any user if the env var was ever missing.
| Local development still works without one (a warning is printed).
*/

const DEV_FALLBACK_SECRET = "evc-local-development-only-secret";

let warnedAboutDevSecret = false;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (secret && secret.length >= 32) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is missing or shorter than 32 characters. Set it in the Vercel environment."
    );
  }

  if (secret) {
    return secret;
  }

  if (!warnedAboutDevSecret) {
    warnedAboutDevSecret = true;
    console.warn(
      "[auth] JWT_SECRET is not set. Using a development-only secret."
    );
  }

  return DEV_FALLBACK_SECRET;
}

/*
|--------------------------------------------------------------------------
| Token kinds
|--------------------------------------------------------------------------
| Login cookies and password-reset links are both JWTs signed with the same
| secret, so each carries a "typ" claim. A reset link can never be used as a
| login, and a login cookie can never be used to reset a password.
| Login tokens issued before this change have no "typ"; they are still
| accepted until they expire (7 days at most).
*/

const SESSION_TYPE = "session";
const RESET_TYPE = "pwd_reset";

export interface AuthTokenPayload {
  userId: string;
  /** Password fingerprint at login time (absent on tokens issued before W1d). */
  pwf?: string;
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
| Create JWT (login session)
|--------------------------------------------------------------------------
*/

/**
 * passwordHash is included as a short fingerprint so that changing or
 * resetting the password logs out every other device (see lib/session.ts).
 */
export function generateToken(userId: string, passwordHash?: string): string {
  return jwt.sign(
    {
      userId,
      typ: SESSION_TYPE,
      ...(passwordHash ? { pwf: passwordFingerprint(passwordHash) } : {}),
    },
    getJwtSecret(),
    {
      expiresIn: "7d",
      algorithm: "HS256",
    }
  );
}

/*
|--------------------------------------------------------------------------
| Verify JWT (login session)
|--------------------------------------------------------------------------
*/

export function verifyToken(
  token: string
): AuthTokenPayload {
  const payload = jwt.verify(token, getJwtSecret(), {
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

  // Reject anything that is not a session token (e.g. a reset link).
  if (payload.typ !== undefined && payload.typ !== SESSION_TYPE) {
    throw new JsonWebTokenError("Wrong token type");
  }

  return {
    userId: payload.userId,
    ...(typeof payload.pwf === "string" ? { pwf: payload.pwf } : {}),
  };
}

/*
|--------------------------------------------------------------------------
| Password reset tokens
|--------------------------------------------------------------------------
| The reset token carries a short fingerprint of the current password hash.
| Once the password changes, the fingerprint no longer matches, so each
| reset link works only once and dies as soon as the password is changed
| any other way.
*/

export function passwordFingerprint(passwordHash: string): string {
  return createHash("sha256")
    .update(passwordHash)
    .digest("hex")
    .slice(0, 16);
}

export function generatePasswordResetToken(
  userId: string,
  passwordHash: string
): string {
  return jwt.sign(
    {
      userId,
      typ: RESET_TYPE,
      pwf: passwordFingerprint(passwordHash),
    },
    getJwtSecret(),
    {
      expiresIn: "15m",
      algorithm: "HS256",
    }
  );
}

export function verifyPasswordResetToken(
  token: string
): { userId: string; fingerprint: string } | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      payload.typ !== RESET_TYPE ||
      typeof payload.userId !== "string" ||
      typeof payload.pwf !== "string"
    ) {
      return null;
    }

    return { userId: payload.userId, fingerprint: payload.pwf };
  } catch {
    return null;
  }
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
  } catch {
    return null;
  }
}
