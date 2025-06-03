import { createClient } from "@vercel/kv";

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password required" });
  }

  // Check against environment variable
  if (password === process.env.CREATOR_SECRET_KEY) {
    return res.status(200).json({
      success: true,
      user: {
        name: "Ahiya",
        email: "ahiya.butman@gmail.com",
        language: "en",
        isCreator: true,
      },
    });
  }

  return res.status(401).json({ error: "Invalid credentials" });
}
