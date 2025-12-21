import { ApiRouteConfig, Handlers } from "motia";
import { db } from "../../config/db";
import { prompts } from "../../config/schema";
import { desc } from "drizzle-orm";

export const config: ApiRouteConfig = {
  type: "api",
  name: "GetPrompts",
  path: "/prompt/get",
  method: "GET",
  emits: [],
  flows: ["prompt-management"],
};

export const handler: Handlers["GetPrompts"] = async () => {
  const allPrompts = await db.select().from(prompts).orderBy(desc(prompts.createdAt));

  console.log('allPrompts', allPrompts)

  return {
    status: 200,
    body: allPrompts,
  };
};
