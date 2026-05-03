import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = request.body;

    if (!username || !password) {
      return response.status(400).json({ error: 'Identifiant et mot de passe requis' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Initialize default user if not exists
    try {
      const exists = await redis.hexists('eva-users', 'nella');
      if (!exists) {
        await redis.hset('eva-users', { nella: 'prime' });
      }
    } catch (e) {
      console.error("Redis Init Error:", e);
      return response.status(500).json({ error: 'Erreur de connexion à la base de données Redis (variables Vercel manquantes ?): ' + e.message });
    }

    // Get the password from Redis
    const storedPassword = await redis.hget('eva-users', cleanUsername);

    if (storedPassword && storedPassword === cleanPassword) {
      return response.status(200).json({ success: true });
    } else {
      return response.status(401).json({ error: 'Identifiants incorrects' });
    }
  } catch (error) {
    console.error("Login API Error:", error);
    return response.status(500).json({ error: 'Erreur interne du serveur: ' + error.message });
  }
}
