import { ApiRouteConfig, Handlers } from "motia";
import { db } from "../../config/db";
import { users } from "../../config/schema";

export const config: ApiRouteConfig = {
  type: "api",
  name: "ListPrompts",
  path: "/prompts/:userId",
  method: "GET",
  emits: [],
  flows: ["prompt-management"],
};

export const handler: Handlers["ListPrompts"] = async (req, { logger }) => {
  const userId = req.pathParams.id;

  const allUsers = await db.select().from(users);

  console.log(allUsers)


  return {
    status: 200,
    body: allUsers[0],
  };
};
