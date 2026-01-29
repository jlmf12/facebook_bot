export default async function handler(req, res) {
  const VERIFY_TOKEN = "miverify123"; // tu token de verificación
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // define esto en Vercel como variable de entorno
  const KEYWORD = "info"; // palabra clave que activa el mensaje
  const MENSAJE = "¡Gracias por tu interés! Aquí tienes más información: https://tupágina.com";

  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send("Verificación fallida");
    }
  }

  if (req.method === "POST") {
    const body = req.body;

    if (body.object === "page") {
      for (const entry of body.entry) {
        const change = entry.changes?.[0];
        if (!change || change.field !== "comments") continue;

        const comment = change.value;
        const text = comment.message?.toLowerCase() || "";
        const senderId = comment.from?.id;

        if (text.includes(KEYWORD) && senderId) {
          try {
            await fetch(`https://graph.facebook.com/v18.0/${comment.post_id}/private_replies`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                message: MENSAJE,
                access_token: PAGE_ACCESS_TOKEN
              })
            });
            console.log("Mensaje enviado a:", senderId);
          } catch (error) {
            console.error("Error al enviar mensaje:", error);
          }
        }
      }

      return res.status(200).send("Evento procesado");
    }

    return res.status(404).send("No es un evento de página");
  }

  res.status(405).send("Método no permitido");
}
