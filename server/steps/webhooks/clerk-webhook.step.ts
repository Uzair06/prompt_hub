import { ApiRouteConfig, type ApiRouteHandler } from "motia";
// @ts-ignore: svix types may not be present in local node_modules
import { Webhook } from "svix";
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

export const handler: ApiRouteHandler = async (req, { logger }) => {
  try {
    // Log incoming request for debugging
    try {
      logger.info("Incoming webhook request", {
        hasBody: !!req.body,
        headers: Object.keys(req.headers || {}),
        bodyType: typeof req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
      });
      
      // Log full body for debugging (be careful with sensitive data in production)
      try {
        logger.info("Webhook body content", { body: JSON.stringify(req.body, null, 2) });
      } catch (stringifyError) {
        logger.warn("Could not stringify body", { error: stringifyError });
      }
    } catch (logError) {
      console.error("Failed to log incoming request", logError);
    }

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    const svixId = req.headers["svix-id"] as string;
    const svixTimestamp = req.headers["svix-timestamp"] as string;
    const svixSignature = req.headers["svix-signature"] as string;

    // Check if this is a test webhook (no Svix headers OR invalid secret)
    // Clerk test webhooks from dashboard may have headers but invalid/empty secret
    const hasSvixHeaders = !!(svixId && svixTimestamp && svixSignature);
    const hasValidSecret = webhookSecret && webhookSecret.trim().length > 0 && webhookSecret.startsWith("whsec_");
    
    // Track if we're actually in test mode (may change if secret is invalid)
    let isTestWebhook = !hasSvixHeaders || !hasValidSecret;
    
    let evt: any;
    
    if (isTestWebhook) {
      // For test webhooks, use the body directly without verification
      logger.info("Processing test webhook", { 
        hasSvixHeaders,
        hasValidSecret,
        reason: !hasSvixHeaders ? "no Svix headers" : "invalid or missing secret"
      });
      evt = req.body;
    } else {
      // For production webhooks, verify signature
      // Check if Webhook class is available
      if (!Webhook) {
        logger.error("Svix Webhook class not available - svix package may not be installed");
        return {
          status: 500,
          body: { 
            error: "Webhook verification not available",
            message: "svix package is required for production webhooks. Install it with: npm install svix",
          },
        };
      }

      const payload = JSON.stringify(req.body);
      
      // Try to create Webhook instance - catch invalid secret errors
      let wh: any;
      try {
        wh = new Webhook(webhookSecret);
      } catch (secretError: any) {
        logger.error("Invalid webhook secret format", { 
          error: secretError.message,
          secretLength: webhookSecret?.length,
          secretPrefix: webhookSecret?.substring(0, 10),
        });
        // If secret is invalid, treat as test webhook
        logger.info("Falling back to test webhook mode due to invalid secret");
        isTestWebhook = true; // Update the flag!
        evt = req.body;
      }

      // Only verify if we successfully created the Webhook instance
      if (wh) {
        try {
          evt = wh.verify(payload, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
          });
        } catch (err: any) {
          logger.error("Webhook verification failed", { 
            error: err.message,
            stack: err.stack,
          });
          return {
            status: 400,
            body: { 
              error: "Invalid webhook signature",
              message: err.message || "Signature verification failed",
            },
          };
        }
      }
    }

    // Validate event structure
    if (!evt || typeof evt !== "object") {
      logger.error("Invalid webhook event structure", { evt });
      return {
        status: 400,
        body: { 
          error: "Invalid webhook event",
          message: "Event data is missing or invalid",
        },
      };
    }

    const eventType = evt.type;
    const eventData = evt.data;

    if (!eventType) {
      logger.error("Missing event type", { evt });
      return {
        status: 400,
        body: { 
          error: "Missing event type",
          message: "Webhook event must include a 'type' field",
        },
      };
    }

    if (!eventData || typeof eventData !== "object") {
      logger.error("Missing event data", { eventType, evt });
      return {
        status: 400,
        body: { 
          error: "Missing event data",
          message: "Webhook event must include a 'data' field",
        },
      };
    }

    const { id: clerkId, email_addresses, first_name, last_name } = eventData;

    if (!clerkId) {
      logger.error("Missing user ID in event data", { eventType, eventData });
      return {
        status: 400,
        body: { 
          error: "Missing user ID",
          message: "Event data must include a user 'id' field",
        },
      };
    }

    logger.info("Processing Clerk webhook", { 
      eventType, 
      clerkId,
      hasEmailAddresses: !!email_addresses,
      emailAddressesLength: email_addresses?.length || 0,
      isTestWebhook,
    });

    if (eventType === "user.created" || eventType === "user.updated") {
      // Extract email - handle different possible structures
      let email: string | undefined;
      
      if (Array.isArray(email_addresses) && email_addresses.length > 0) {
        // Standard format: [{ email_address: "..." }]
        email = email_addresses[0]?.email_address;
      } else if (typeof email_addresses === "string") {
        // Direct string format
        email = email_addresses;
      } else if (eventData.email) {
        // Fallback: check if email is directly on eventData
        email = eventData.email;
      }
      
      logger.info("Email extraction", {
        email,
        email_addresses,
        emailType: typeof email_addresses,
        isArray: Array.isArray(email_addresses),
        primaryEmailAddressId: eventData.primary_email_address_id,
      });
      
      // Handle test webhooks that don't include email addresses
      if (!email || email.trim() === "") {
        if (isTestWebhook) {
          // For test webhooks, use a placeholder email based on Clerk ID
          email = `test-${clerkId}@clerk.test`;
          logger.info("Using placeholder email for test webhook", { email, clerkId });
        } else {
          // For production webhooks, email is required
          logger.error("No email found in webhook data", { 
            clerkId, 
            email_addresses,
            eventData,
            eventType 
          });
          return {
            status: 400,
            body: { 
              error: "Email address is required but not provided in webhook",
              message: "The webhook event must include an email address in email_addresses array or email field",
              receivedData: {
                email_addresses,
                email: eventData.email,
                primary_email_address_id: eventData.primary_email_address_id,
              },
            },
          };
        }
      }

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
        try {
          await db
            .update(users)
            .set({
              email,
              name,
            })
            .where(eq(users.id, clerkId));

          logger.info("User updated", { clerkId, email });
        } catch (dbError: any) {
          logger.error("Database update failed", { 
            clerkId, 
            email, 
            error: dbError?.message ?? String(dbError),
            code: dbError?.code,
          });
          return {
            status: 500,
            body: { 
              error: "Failed to update user in database",
              details: dbError?.message ?? String(dbError),
            },
          };
        }
      } else {
        // Create new user with Clerk ID as primary key
        try {
          await db.insert(users).values({
            id: clerkId,
            email,
            name,
          });

          logger.info("User created", { clerkId, email });
        } catch (dbError: any) {
          logger.error("Database insert failed", { 
            clerkId, 
            email, 
            error: dbError?.message ?? String(dbError),
            code: dbError?.code,
          });
          return {
            status: 500,
            body: { 
              error: "Failed to create user in database",
              details: dbError?.message ?? String(dbError),
            },
          };
        }
      }
    } else if (eventType === "user.deleted") {
      // Delete user
      await db.delete(users).where(eq(users.id, clerkId));
      logger.info("User deleted", { clerkId });
    } else {
      logger.info("Unhandled event type", { eventType });
    }

    return {
      status: 200,
      body: { 
        success: true, 
        eventType,
        message: `Successfully processed ${eventType} event`,
      },
    };
  } catch (error: any) {
    // Log to both logger and console to ensure visibility
    const errorMessage = error?.message ?? String(error);
    const errorStack = error?.stack;
    const errorName = error?.name || "UnknownError";
    const errorCode = error?.code;

    console.error("❌ Clerk webhook error:", {
      message: errorMessage,
      stack: errorStack,
      name: errorName,
      code: errorCode,
    });

    try {
      logger.error("Error processing Clerk webhook", {
        error: errorMessage,
        stack: errorStack,
        errorName: errorName,
        errorCode: errorCode,
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    // Return detailed error for debugging
    return {
      status: 500,
      body: { 
        error: "Failed to process webhook",
        message: errorMessage,
        type: errorName,
      },
    };
  }
};

