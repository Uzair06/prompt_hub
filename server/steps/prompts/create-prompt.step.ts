import { ApiRouteConfig, Handlers } from "motia";
import { z } from "zod";
import { db } from "../../config/db";
import { prompts } from "../../config/schema";
import { responseSchema } from "../../schema/prompts";
import { errorSchema } from "../../schema/error-schema";

const bodySchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
  userId: z.uuid("UserId must be a valid UUID"),
});

export const config: ApiRouteConfig = {
  type: "api",
  name: "CreatePrompt",
  path: "/prompt/create",
  method: "POST",
  emits: [],
  flows: ["prompt-management"],
  bodySchema,
  responseSchema: {
    201: responseSchema,
    400: errorSchema,
    500: errorSchema,
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