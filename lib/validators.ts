import { z } from "zod";

/*
|--------------------------------------------------------------------------
| User Signup Validation
|--------------------------------------------------------------------------
*/

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters"),

  email: z
    .string()
    .trim()
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

/*
|--------------------------------------------------------------------------
| User Login Validation
|--------------------------------------------------------------------------
*/

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

/*
|--------------------------------------------------------------------------
| ESOP Calculator Validation
|--------------------------------------------------------------------------
*/

export const calculatorSchema = z.object({
  companyName: z.string().trim().min(1),

  currentValuation: z.number().positive(),

  totalShares: z.number().positive(),

  yourShares: z.number().positive(),

  futureValuation: z.number().positive(),

  dilutionPercent: z.number().min(0).max(100),
});