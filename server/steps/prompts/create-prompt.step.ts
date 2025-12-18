import { ApiRouteConfig, Handlers } from "motia";
import { z } from "zod";
import { db } from "../../config/db";
import { prompts } from "../../config/schema";

const bodySchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
});

const responseSchema201 = z.object({
  id: z.number(),
  prompt: z.string().nullable(),
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
    const { prompt } = bodySchema.parse(req.body);

    const [created] = await db
      .insert(prompts)
      .values({ prompt })
      .returning();

    logger.info("Prompt created", { id: created.id });

    return {
      status: 201,
      body: {
        id: created.id,
        prompt: created.prompt,
      },
    };
  } catch (error: any) {
    logger.error("Error creating prompt", {
      error: error?.message ?? String(error),
    });

    if (error?.name === "ZodError") {
      return {
        status: 400,
        body: {
          error: "Invalid request body",
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