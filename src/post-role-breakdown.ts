import 'dotenv/config';
import { createClient, loginClient, getGuild, destroyClient } from './client';
import { ChannelType, TextChannel, Role } from 'discord.js';

async function postRoleBreakdown() {
  const client = createClient();

  console.log('Connecting...');
  await loginClient(client, process.env.DISCORD_TOKEN!);

  const guild = await getGuild(client, process.env.GUILD_ID!);

  // Fetch all roles
  const roles = await guild.roles.fetch();

  const getRole = (name: string): Role | undefined =>
    roles.find(r => r.name === name);

  const mention = (name: string): string => {
    const role = getRole(name);
    return role ? `<@&${role.id}>` : `@${name}`;
  };

  // Find the role-breakdown channel
  const channel = guild.channels.cache.find(
    (c) => c.name === 'role-breakdown' && c.type === ChannelType.GuildText
  ) as TextChannel | undefined;

  if (!channel) {
    console.error('❌ Could not find #role-breakdown channel');
    destroyClient(client);
    process.exit(1);
  }

  console.log('Found #role-breakdown channel');

  // Delete existing messages
  const messages = await channel.messages.fetch({ limit: 10 });
  if (messages.size > 0) {
    console.log(`Deleting ${messages.size} existing messages...`);
    await channel.bulkDelete(messages);
  }

  const content = `
# Role Breakdown

## Verification Roles

${mention('Verified')} - Passed captcha verification

${mention('Lazy')} - Verified holder of a Lazy collection

${mention('Lazy Legend')} - OG holder

## Holder Tiers

${mention('Full Lazy')} - Holds all 3 collections (Lazy Frens, Lazy Groupies, Lazy Birbs)

${mention('Lil Lazy')} - 5+ NFTs

${mention('Majoor Lazy')} - 10+ NFTs

${mention('Whaley Lazy')} - 20+ NFTs

## Staff

${mention('Lazy Team')} - Server moderators & team

---

*Stay Lazy Frens.*
`.trim();

  console.log('Posting role breakdown...');
  await channel.send(content);

  console.log('✅ Role breakdown posted to #role-breakdown');

  destroyClient(client);
}

postRoleBreakdown().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
