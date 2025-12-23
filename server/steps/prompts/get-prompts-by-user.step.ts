import { ApiRouteConfig, Handlers } from "motia";
import { db } from "../../config/db";
import { prompts } from "../../config/schema";
import { desc, eq } from "drizzle-orm";

export const config: ApiRouteConfig = {
  type: "api",
  name: "GetPrompts",
  path: "/prompt/:id",
  method: "GET",
  emits: [],
  flows: ["prompt-management"],
};

export const handler: Handlers["GetPrompts"] = async (req) => {
    const userId = req.pathParams.id
  const allPrompts = await db.query.prompts.findMany({
    where: eq(prompts.userId, userId)
  })

  return {
    status: 200,
    body: allPrompts,
  };
};
