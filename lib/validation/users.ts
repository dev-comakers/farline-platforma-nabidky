import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Neplatný e-mail"),
  name: z.string().min(1).max(100),
  role: z.enum(["admin", "manager"]),
  password: z.string().min(8, "Heslo musí mít alespoň 8 znaků"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["admin", "manager"]).optional(),
  password: z.string().min(8, "Heslo musí mít alespoň 8 znaků").optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
