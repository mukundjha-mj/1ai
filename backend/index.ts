import express from "express";
import { CreateChatSchema, Role } from "./types";
import { createCompletion } from "./openrouter";
import { InMemoryStore } from "./InMemoryStore";
import { randomUUIDv5 } from "bun";
const app = express();
app.use(express.json());

app.post("/chat", async (req, res) =>{
    
    const { success, data } = CreateChatSchema.safeParse(req.body);

    const conversationId = data?.conversationId ?? Bun.randomUUIDv7();

    
    if (!success) {
        res.status(411).json({
            message: "Incorrect inputs"
        })
    return
}
    let existingMessages = InMemoryStore.getInstance().get(conversationId);

    res.setHeader('Content-Type', 'text/even-stream; charset=utf-8');
    res.setHeader('Connection', 'keep-alive');
    let message = "";
    //EventEmitters
    await createCompletion([...existingMessages, {
        role: Role.User,
        content: data.message
    }], data.model, (chunk: string)=>{
        message += chunk;
        res.write(chunk);
    });
    res.end();

    InMemoryStore.getInstance().add(conversationId, {
        role: Role.User,
        content: data.message
    })


    InMemoryStore.getInstance().add(conversationId, {
        role: Role.Agent,
        content: message
    })

    // store in the db
})

app.listen(3000);