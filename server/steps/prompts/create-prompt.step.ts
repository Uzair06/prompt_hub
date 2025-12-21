import { ApiRouteConfig, Handlers } from "motia";
import { z } from "zod";
import { db } from "../../config/db";
import { prompts } from "../../config/schema";

const bodySchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
  userId: z.string().uuid("UserId must be a valid UUID"),
});

const responseSchema201 = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
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
    const { content, userId } = bodySchema.parse(req.body);

    const [created] = await db
      .insert(prompts)
      .values({ 
        content,
        userId,
      })
      .returning();

    logger.info("Prompt created", { id: created.id });

    return {
      status: 201,
      body: {
        id: created.id,
        userId: created.userId,
        content: created.content,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
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