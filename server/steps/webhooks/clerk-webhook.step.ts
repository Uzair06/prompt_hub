import { ApiRouteConfig, Handlers } from "motia";
import { Webhook } from "@clerk/backend";
import { db } from "../../config/db";
import { users } from "../../config/schema";
import { eq } from "drizzle-orm";

export const config: ApiRouteConfig = {
  type: "api",
  name: "ClerkWebhook",
  path: "/webhooks/clerk",
  method: "POST",
  emits: [],
  flows: [],
};

export const handler: Handlers["ClerkWebhook"] = async (req, { logger }) => {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("CLERK_WEBHOOK_SECRET is not set");
      return {
        status: 500,
        body: { error: "Webhook secret not configured" },
      };
    }

    const svixId = req.headers["svix-id"] as string;
    const svixTimestamp = req.headers["svix-timestamp"] as string;
    const svixSignature = req.headers["svix-signature"] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      return {
        status: 400,
        body: { error: "Missing svix headers" },
      };
    }

    const payload = JSON.stringify(req.body);
    const wh = new Webhook(webhookSecret);

    let evt: any;
    try {
      evt = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err: any) {
      logger.error("Webhook verification failed", { error: err.message });
      return {
        status: 400,
        body: { error: "Invalid webhook signature" },
      };
    }

    const eventType = evt.type;
    const { id: clerkId, email_addresses, first_name, last_name } = evt.data;

    logger.info("Processing Clerk webhook", { eventType, clerkId });

    if (eventType === "user.created" || eventType === "user.updated") {
      const email = email_addresses?.[0]?.email_address || "";
      const name = first_name && last_name 
        ? `${first_name} ${last_name}` 
        : first_name || last_name || null;

      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, clerkId))
        .limit(1);

      if (existingUser.length > 0) {
        // Update existing user
        await db
          .update(users)
          .set({
            email,
            name,
          })
          .where(eq(users.id, clerkId));

        logger.info("User updated", { clerkId, email });
      } else {
        // Create new user with Clerk ID as primary key
        await db.insert(users).values({
          id: clerkId,
          email,
          name,
        });

        logger.info("User created", { clerkId, email });
      }
    } else if (eventType === "user.deleted") {
      // Delete user
      await db.delete(users).where(eq(users.id, clerkId));
      logger.info("User deleted", { clerkId });
    }

    return {
      status: 200,
      body: { success: true, eventType },
    };
  } catch (error: any) {
    logger.error("Error processing Clerk webhook", {
      error: error?.message ?? String(error),
    });

    return {
      status: 500,
      body: { error: "Failed to process webhook" },
    };
  }
};

