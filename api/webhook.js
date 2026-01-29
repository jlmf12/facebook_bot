export default function handler(req, res) {
  const VERIFY_TOKEN = "miverify123"; // cambia esto por tu token real

  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verificado correctamente");
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Verificación fallida");
    }
  }

  if (req.method === "POST") {
    const body = req.body;

    if (body.object === "page") {
      body.entry.forEach(entry => {
        const event = entry.messaging?.[0] || entry.changes?.[0];
        if (!event) return;

        // Aquí puedes filtrar por palabra clave, ID de publicación, etc.
        console.log("Evento recibido:", JSON.stringify(event, null, 2));
      });

      res.status(200).send("Evento recibido");
    } else {
      res.status(404).send("No es un evento de página");
    }
  }
}
