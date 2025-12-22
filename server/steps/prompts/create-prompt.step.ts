import { ApiRouteConfig, Handlers } from "motia";
import { z } from "zod";
import { createClerkClient } from "@clerk/backend";
import { db } from "../../config/db";
import { prompts, users } from "../../config/schema";
import { eq } from "drizzle-orm";

const bodySchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
});

const responseSchema201 = z.object({
  id: z.string().uuid(),
  userId: z.string(), // Clerk ID (text, not UUID)
  content: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const responseSchema400 = z.object({
  error: z.string(),
});

const responseSchema500 = z.object({
  error: z.string(),
});

export const config: ApiRouteConfig = {
  type: "api",
  name: "CreatePrompt",
  path: "/prompts",
  method: "POST",
  emits: [],
  flows: ["prompt-management"],
  bodySchema,
  responseSchema: {
    201: responseSchema201,
    400: responseSchema400,
    500: responseSchema500,
  },
};

export const handler: Handlers["CreatePrompt"] = async (req, { logger }) => {
  try {
    const { content } = bodySchema.parse(req.body);

    // Extract Clerk token from Authorization header
    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        status: 401,
        body: { error: "Missing or invalid authorization header" },
      };
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token and get user from Clerk
    const clerk = createClerkClient({ 
      secretKey: process.env.CLERK_SECRET_KEY || "" 
    });

    let clerkId: string;
    try {
      // Use authenticateRequest to verify the token
      const authResult = await clerk.authenticateRequest({
        headers: new Headers({
          authorization: authHeader,
        }),
      } as any);

      if (!authResult || !authResult.userId) {
        return {
          status: 401,
          body: { error: "Invalid or expired token" },
        };
      }

      clerkId = authResult.userId;
    } catch (error: any) {
      logger.error("Token verification failed", { error: error?.message });
      return {
        status: 401,
        body: { error: "Invalid or expired token" },
      };
    }

    // Find user in database by Clerk ID (which is now the primary key)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, clerkId))
      .limit(1);

    if (!user) {
      return {
        status: 404,
        body: { error: "User not found. Please ensure you're registered." },
      };
    }

    // Create prompt with user's Clerk ID (stored as user_id)
    const [created] = await db
      .insert(prompts)
      .values({ 
        content,
        userId: clerkId, // Use Clerk ID directly as user_id
      })
      .returning();

    logger.info("Prompt created", { id: created.id });

    return {
      status: 201,
      body: {
        id: created.id,
        userId: created.userId,
        content: created.content,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    logger.error("Error creating prompt", {
      error: error?.message ?? String(error),
    });

    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
      return {
        status: 400,
        body: {
          error: `Validation error: ${errorMessages.join(", ")}`,
        },
      };
    }

    return {
      status: 500,
      body: {
        error: "Failed to create prompt",
      },
    };
  }
};