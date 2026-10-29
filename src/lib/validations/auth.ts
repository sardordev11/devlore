import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Invalid email address"));

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// bcrypt ignores anything past 72 bytes
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

const passwordsMatch = {
  check: (data: { password: string; confirmPassword: string }) =>
    data.password === data.confirmPassword,
  params: { message: "Passwords do not match", path: ["confirmPassword"] },
};

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch.check, passwordsMatch.params);

export const resendVerificationSchema = z.object({ email: emailSchema });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset link is invalid"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(passwordsMatch.check, passwordsMatch.params);
