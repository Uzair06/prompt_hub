import { ApiRouteConfig, Handlers } from "motia";
import { requestSchema, responseSchema } from "../../schema/prompts";
import { db } from "../../config/db";
import { prompts } from "../../config/schema";
import { eq, sql } from "drizzle-orm";

export const config: ApiRouteConfig = {
    type: 'api',
    name: 'UpdatePrompt',
    path: '/prompt/:id',
    method: 'PATCH', //put for full replacement,
    bodySchema: requestSchema,
    // responseSchema:{
    //     200: responseSchema
    // },
    flows: ["prompt-management"],
    emits: []
}

export const handler: Handlers['UpdatePrompt'] = async(req, {logger}) => {
    try{
        const {content} = requestSchema.parse(req.body)
    const promptId = req.pathParams.id

    const updatedPrompt = await db.update(prompts).set({content: content, updatedAt: sql `NOW()`}).where(eq(prompts.id, promptId)).returning()

    console.log('updatedPrompt', updatedPrompt)

    return {
        status: 200,
        body: updatedPrompt
    }
    }catch(error){
        logger.info('Error updating prompt', error)


    }

}