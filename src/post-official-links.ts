import 'dotenv/config';
import { createClient, loginClient, getGuild, destroyClient } from './client';
import { ChannelType, TextChannel } from 'discord.js';

async function postOfficialLinks() {
  const client = createClient();

  console.log('Connecting...');
  await loginClient(client, process.env.DISCORD_TOKEN!);

  const guild = await getGuild(client, process.env.GUILD_ID!);

  const channel = guild.channels.cache.find(
    (c) => c.name === 'official-links' && c.type === ChannelType.GuildText
  ) as TextChannel | undefined;

  if (!channel) {
    console.error('❌ Could not find #official-links channel');
    destroyClient(client);
    process.exit(1);
  }

  console.log('Found #official-links channel');

  // Delete existing messages
  const messages = await channel.messages.fetch({ limit: 10 });
  if (messages.size > 0) {
    console.log(`Deleting ${messages.size} existing messages...`);
    await channel.bulkDelete(messages);
  }

  const content = `
# Official Links

## Collections on OpenSea

🦁 **Lazy Frens** - https://opensea.io/collection/lazyfrens

🐦 **Lazy Birbs** - https://opensea.io/collection/lazy-birbs

🎸 **Lazy Groupies** - https://opensea.io/collection/lazy-groupies

## Websites

🎮 **The Lazy Place** - https://lp.lazyfrank.xyz
*Home of Swipestr - swipe-based NFT floor buying game*

🐦 **Birbs Page** - https://birbs.lazyfrank.xyz

🖼️ **Birb Tool** - https://birb-tool.lazyfrank.xyz
*PNG downloader for Birbs (SVG → PNG)*

## X (Twitter)

👤 **@TheLazyFrank** - https://x.com/TheLazyFrank

🦁 **@LazyFrens** - https://x.com/LazyFrens

🐦 **@Lazy_Birbs** - https://x.com/Lazy_Birbs

🎸 **@LazyGroupies** - https://x.com/LazyGroupies

---

*Stay Lazy Frens.*
`.trim();

  console.log('Posting official links...');
  await channel.send(content);

  console.log('✅ Official links posted');

  destroyClient(client);
}

postOfficialLinks().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
