import fetch from "node-fetch";

const KEYWORDS = (process.env.KEYWORDS || "info,detalle,precio")
  .split(",")
  .map(k => k.trim().toLowerCase())
  .filter(Boolean);

const REPLY_MESSAGE =
  process.env.REPLY_MESSAGE ||
  "¡Gracias por tu comentario! Aquí tienes la información que pediste:";
const REPLY_LINK = process.env.REPLY_LINK || "https://tuenlace.com";

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

async function sendPrivateReply(commentId, message) {
  const url = `https://graph.facebook.com/v19.0/${commentId}/private_replies?access_token=${PAGE_ACCESS_TOKEN}`;

  const body = {
    message
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Error al enviar private_reply:", res.status, text);
  } else {
    console.log("Private reply enviado correctamente a commentId:", commentId);
  }
}

function commentHasKeyword(message) {
  if (!message) return false;
  const text = message.toLowerCase();
  return KEYWORDS.some(keyword => text.includes(keyword));
}

export default async function handler(req, res) {
  // Verificación del webhook (GET)
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verificado correctamente");
      return res.status(200).send(challenge);
    } else {
      console.warn("Fallo en la verificación del webhook");
      return res.sendStatus(403);
    }
  }

  // Recepción de eventos (POST)
  if (req.method === "POST") {
    const body = req.body;

    if (body.object === "page") {
      for (const entry of body.entry || []) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field === "feed" && change.value && change.value.item === "comment") {
            const commentId = change.value.comment_id;
            const message = change.value.message;
            const fromId = change.value.from && change.value.from.id;

            console.log("Comentario recibido:", {
              commentId,
              fromId,
              message
            });

            if (commentHasKeyword(message)) {
              const fullMessage = `${REPLY_MESSAGE} ${REPLY_LINK}`;
              await sendPrivateReply(commentId, fullMessage);
            } else {
              console.log("Comentario sin palabra clave, no se responde.");
            }
          }
        }
      }

      return res.status(200).send("EVENT_RECEIVED");
    }

    return res.sendStatus(404);
  }

  return res.status(405).send("Method Not Allowed");
}
