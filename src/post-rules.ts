import 'dotenv/config';
import { createClient, loginClient, getGuild, destroyClient } from './client';
import { ChannelType, TextChannel } from 'discord.js';

const RULES_CONTENT = `
# Server Rules

😃 **1. Be cool, kind, and respectful to one another.**

📇 **2. Keep your Discord profile appropriate.**

✉️ **3. Do not spam.**

🔔 **4. Do not @mention or direct message the staff.**

📣 **5. No self-promotion or advertisements.**

🛡️ **6. No personal information.**

🤬 **7. No hate speech or harmful language.**

🏛️ **8. No political or religious topics.**

🚨 **9. No piracy, sexual, NSFW, or otherwise suspicious content.**

🤔 **10. Rules are subject to common sense.**
`.trim();

async function postRules() {
  const client = createClient();

  console.log('Connecting...');
  await loginClient(client, process.env.DISCORD_TOKEN!);

  const guild = await getGuild(client, process.env.GUILD_ID!);

  // Find the rules channel
  const rulesChannel = guild.channels.cache.find(
    (c) => c.name === 'rules' && c.type === ChannelType.GuildText
  ) as TextChannel | undefined;

  if (!rulesChannel) {
    console.error('❌ Could not find #rules channel');
    destroyClient(client);
    process.exit(1);
  }

  console.log(`Found #rules channel`);

  // Delete existing messages in the channel (clean slate)
  const messages = await rulesChannel.messages.fetch({ limit: 10 });
  if (messages.size > 0) {
    console.log(`Deleting ${messages.size} existing messages...`);
    await rulesChannel.bulkDelete(messages);
  }

  // Post the rules
  console.log('Posting rules...');
  await rulesChannel.send(RULES_CONTENT);

  console.log('✅ Rules posted to #rules');

  destroyClient(client);
}

postRules().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
