import { Guild } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

export interface EmojiSyncResult {
  created: string[];
  deleted: string[];
  unchanged: string[];
  errors: string[];
}

const ASSETS_DIR = path.join(process.cwd(), 'assets', 'emojis');
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

/**
 * Scan the emojis folder and return emoji definitions based on filenames
 */
function scanEmojiFolder(): { name: string; file: string }[] {
  if (!fs.existsSync(ASSETS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(ASSETS_DIR);
  const emojis: { name: string; file: string }[] = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (SUPPORTED_EXTENSIONS.includes(ext)) {
      const name = path.basename(file, ext);
      emojis.push({ name, file });
    }
  }

  return emojis;
}

/**
 * Sync emojis from assets/emojis folder to Discord
 * Uses filename (without extension) as emoji name
 */
export async function syncEmojis(
  guild: Guild,
  _emojiDefinitions: unknown, // Ignored - we scan the folder instead
  dryRun: boolean = false
): Promise<EmojiSyncResult> {
  const result: EmojiSyncResult = {
    created: [],
    deleted: [],
    unchanged: [],
    errors: [],
  };

  console.log('\n😀 Syncing emojis...');

  // Scan folder for emoji files
  const emojiFiles = scanEmojiFolder();

  if (emojiFiles.length === 0) {
    console.log('  ℹ️  No emoji files in assets/emojis/');
    return result;
  }

  console.log(`  📂 Found ${emojiFiles.length} emoji files`);

  // Fetch existing emojis
  const existingEmojis = await guild.emojis.fetch();
  const existingEmojiMap = new Map<string, string>();

  for (const [id, emoji] of existingEmojis) {
    if (emoji.name) {
      existingEmojiMap.set(emoji.name, id);
    }
  }

  // Process each emoji file
  for (const emoji of emojiFiles) {
    const existingId = existingEmojiMap.get(emoji.name);

    if (existingId) {
      console.log(`  ✓ Emoji exists: :${emoji.name}:`);
      result.unchanged.push(emoji.name);
      continue;
    }

    const filePath = path.join(ASSETS_DIR, emoji.file);

    console.log(`  ➕ Creating emoji: :${emoji.name}:`);
    if (!dryRun) {
      try {
        await guild.emojis.create({
          attachment: filePath,
          name: emoji.name,
          reason: 'Synced from assets folder',
        });
        result.created.push(emoji.name);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`    ❌ Error: ${message}`);
        result.errors.push(`${emoji.name}: ${message}`);
      }
    } else {
      result.created.push(emoji.name);
    }
  }

  return result;
}
