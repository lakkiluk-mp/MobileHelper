import { UnauthorizedError, requireUserId } from "@/lib/auth/verify.server";
import type { z } from "zod";

export function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

export async function readBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T> | null> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return null;
  }
  const parsed = schema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

export async function withUser(handler: (userId: string) => Promise<Response>): Promise<Response> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (error) {
    if (error instanceof UnauthorizedError) return jsonError(401, "unauthorized");
    throw error;
  }
  return handler(userId);
}
