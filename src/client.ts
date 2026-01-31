import { Client, GatewayIntentBits, Guild } from 'discord.js';

/**
 * Create and configure the Discord client
 */
export function createClient(): Client {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildEmojisAndStickers,
    ],
  });
}

/**
 * Login the client and wait for it to be ready
 */
export async function loginClient(client: Client, token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Client login timed out'));
    }, 30000);

    client.once('ready', () => {
      clearTimeout(timeout);
      console.log(`✓ Logged in as ${client.user?.tag}`);
      resolve();
    });

    client.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    client.login(token).catch(reject);
  });
}

/**
 * Get a guild by ID
 */
export async function getGuild(
  client: Client,
  guildId: string
): Promise<Guild> {
  const guild = await client.guilds.fetch(guildId);
  if (!guild) {
    throw new Error(`Guild not found: ${guildId}`);
  }
  return guild;
}

/**
 * Destroy the client connection
 */
export function destroyClient(client: Client): void {
  client.destroy();
}
