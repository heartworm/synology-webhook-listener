import Fastify from "fastify";
import { readFileSync } from "fs";

function getSecret(name: string) {
    return readFileSync(`./secrets/${name}.txt`, "utf8");
}

const chatId = getSecret("chat-id");
const botToken = getSecret("bot-token");

const fastify = Fastify({
    logger: {
        transport: {
            target: "pino-pretty",
        },
    },
});
const { log } = fastify;

interface WebhookInput {
    heading: string;
    body: string;
    imageUrl: string;
}

fastify.post("/sendImage", {
    schema: {
        body: {
            type: "object",
            properties: {
                heading: { type: "string" },
                body: { type: "string" },
                imageUrl: { type: "string" },
            },
            required: ["heading", "body", "imageUrl"],
        },
    },
    async handler(request) {
        log.info({ body: request.body }, "Got POST request.");
        const { heading, body, imageUrl } = request.body as WebhookInput;
        const content = `<b>${heading}</b>\n${body}`;

        const imageBlob = await getImage(imageUrl);
        await sendPhoto(imageBlob, content);
    },
});

async function getImage(url: string): Promise<Blob> {
    log.info(`Getting image at: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Got non OK status while getting image: " + response.status);
    }
    const contentType = response.headers.get("Content-Type");
    if (!contentType?.startsWith("image")) {
        throw new Error("Got non image Content-Type: " + contentType);
    }
    return await response.blob();
}

// async function sendMessage(htmlMessage: string) {
//     return callTelegramApi("sendMessage", {
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//             chat_id: chatId,
//             parse_mode: "HTML",
//             text: htmlMessage,
//         }),
//     });
// }

async function sendPhoto(blob: Blob, htmlCaption?: string) {
    const formData = new FormData();
    formData.set("photo", blob);
    formData.set("chat_id", chatId);
    formData.set("parse_mode", "HTML");
    if (htmlCaption) {
        formData.set("caption", htmlCaption);
    }

    await callTelegramApi("sendPhoto", { body: formData });
}

type TelegramResponse = {
    ok: boolean;
    description?: string;
}

async function callTelegramApi(api: string, input: Partial<RequestInit>): Promise<TelegramResponse> {
    log.info({ input }, `Calling telegram API: ${api}`);
    const response = await fetch(`https://api.telegram.org/bot${botToken}/${api}`, {
        method: "POST",
        ...input,
    });

    const json = (await response.json()) as TelegramResponse;
    const { ok, description } = json;
    if (!ok) {
        throw new Error(`Telegram returned 'ok' value of: ${ok}, with cause: ${description}`);
    }

    return json;
}

fastify.listen({ port: 3000, host: "0.0.0.0" }).catch((err: unknown) => {
    log.error(err);
    process.exit(1);
});
