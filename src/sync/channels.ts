import {
  Guild,
  ChannelType,
  CategoryChannel,
  TextChannel,
  VoiceChannel,
  GuildChannel,
  OverwriteResolvable,
} from 'discord.js';
import {
  CategoryDefinition,
  ChannelDefinition,
  ChannelPermissions,
} from '../types/config';
import { permissionNamesToFlags } from '../utils/permissions';
import { getOrCreateRole } from './roles';

export interface ChannelSyncResult {
  categoriesCreated: string[];
  categoriesUpdated: string[];
  channelsCreated: string[];
  channelsUpdated: string[];
  unchanged: string[];
}

type GuildChannelType =
  | ChannelType.GuildText
  | ChannelType.GuildVoice
  | ChannelType.GuildAnnouncement
  | ChannelType.GuildForum
  | ChannelType.GuildStageVoice;

const CHANNEL_TYPE_MAP: Record<string, GuildChannelType> = {
  text: ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
  announcement: ChannelType.GuildAnnouncement,
  forum: ChannelType.GuildForum,
  stage: ChannelType.GuildStageVoice,
};

/**
 * Build permission overwrites from config
 */
async function buildPermissionOverwrites(
  guild: Guild,
  permissions: ChannelPermissions | undefined
): Promise<OverwriteResolvable[]> {
  if (!permissions) return [];

  const overwrites: OverwriteResolvable[] = [];

  for (const [roleName, perms] of Object.entries(permissions)) {
    let roleId: string;

    if (roleName === '@everyone') {
      roleId = guild.id; // @everyone role ID equals guild ID
    } else {
      const role = await getOrCreateRole(guild, roleName);
      if (!role) continue;
      roleId = role.id;
    }

    // If permissions array is empty, deny VIEW_CHANNEL (hide the channel)
    if (perms.length === 0) {
      overwrites.push({
        id: roleId,
        deny: ['ViewChannel'],
      });
    } else {
      // Grant the specified permissions
      const allowFlags = permissionNamesToFlags(perms);
      overwrites.push({
        id: roleId,
        allow: allowFlags,
      });
    }
  }

  return overwrites;
}

/**
 * Sync a single category and its channels
 */
async function syncCategory(
  guild: Guild,
  definition: CategoryDefinition,
  dryRun: boolean,
  result: ChannelSyncResult
): Promise<CategoryChannel | null> {
  const existingCategory = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === definition.name
  ) as CategoryChannel | undefined;

  let category: CategoryChannel;

  if (!existingCategory) {
    console.log(`  ➕ Creating category: ${definition.name}`);
    if (dryRun) {
      result.categoriesCreated.push(definition.name);
      return null;
    }

    const overwrites = await buildPermissionOverwrites(
      guild,
      definition.permissions
    );

    category = await guild.channels.create({
      name: definition.name,
      type: ChannelType.GuildCategory,
      position: definition.position,
      permissionOverwrites: overwrites,
      reason: 'Synced from config',
    });
    result.categoriesCreated.push(definition.name);
  } else {
    // Update category if needed
    const overwrites = await buildPermissionOverwrites(
      guild,
      definition.permissions
    );

    if (overwrites.length > 0 || existingCategory.position !== definition.position) {
      console.log(`  🔄 Updating category: ${definition.name}`);
      if (!dryRun) {
        await existingCategory.edit({
          position: definition.position,
          permissionOverwrites: overwrites.length > 0 ? overwrites : undefined,
          reason: 'Synced from config',
        });
      }
      result.categoriesUpdated.push(definition.name);
    } else {
      console.log(`  ✓ Category unchanged: ${definition.name}`);
      result.unchanged.push(`category:${definition.name}`);
    }
    category = existingCategory;
  }

  // Sync channels within category
  for (const channelDef of definition.channels) {
    await syncChannel(guild, category, channelDef, definition, dryRun, result);
  }

  // Store system channel reference for later
  if (definition.systemChannel && !dryRun) {
    const systemChannel = category.children.cache.find(
      (c) => c.name === definition.systemChannel
    );
    if (systemChannel && systemChannel.type === ChannelType.GuildText) {
      // Store for later use - would need guild settings update
      console.log(
        `  ℹ️  System channel should be: #${definition.systemChannel}`
      );
    }
  }

  return category;
}

/**
 * Sync a single channel within a category
 */
async function syncChannel(
  guild: Guild,
  category: CategoryChannel | null,
  definition: ChannelDefinition,
  categoryDef: CategoryDefinition,
  dryRun: boolean,
  result: ChannelSyncResult
): Promise<void> {
  const channelType: GuildChannelType = CHANNEL_TYPE_MAP[definition.type] || ChannelType.GuildText;

  // Find existing channel
  const existingChannel = category
    ? category.children.cache.find((c) => c.name === definition.name)
    : guild.channels.cache.find(
        (c) => c.name === definition.name && c.parentId === null
      );

  if (!existingChannel) {
    console.log(`    ➕ Creating channel: #${definition.name}`);
    if (dryRun) {
      result.channelsCreated.push(definition.name);
      return;
    }

    // Build permission overwrites
    // Channel-specific permissions override category permissions
    const channelPerms = definition.permissions || categoryDef.permissions;
    const overwrites = await buildPermissionOverwrites(guild, channelPerms);

    const createOptions: Parameters<typeof guild.channels.create>[0] = {
      name: definition.name,
      type: channelType,
      parent: category?.id,
      reason: 'Synced from config',
    };

    if (overwrites.length > 0) {
      createOptions.permissionOverwrites = overwrites;
    }

    if (definition.topic && channelType === ChannelType.GuildText) {
      createOptions.topic = definition.topic;
    }

    if (definition.nsfw !== undefined) {
      createOptions.nsfw = definition.nsfw;
    }

    if (definition.slowmode !== undefined) {
      createOptions.rateLimitPerUser = definition.slowmode;
    }

    if (definition.userLimit !== undefined && channelType === ChannelType.GuildVoice) {
      createOptions.userLimit = definition.userLimit;
    }

    await guild.channels.create(createOptions);
    result.channelsCreated.push(definition.name);
  } else {
    // Update channel if needed
    const needsUpdate = checkChannelNeedsUpdate(
      existingChannel as TextChannel | VoiceChannel,
      definition,
      category
    );

    if (needsUpdate) {
      console.log(`    🔄 Updating channel: #${definition.name}`);
      if (!dryRun) {
        const channelPerms = definition.permissions || categoryDef.permissions;
        const overwrites = await buildPermissionOverwrites(guild, channelPerms);

        const editOptions: Parameters<GuildChannel['edit']>[0] = {
          parent: category?.id,
          reason: 'Synced from config',
        };

        if (overwrites.length > 0) {
          editOptions.permissionOverwrites = overwrites;
        }

        if (
          definition.topic !== undefined &&
          existingChannel.type === ChannelType.GuildText
        ) {
          editOptions.topic = definition.topic;
        }

        await (existingChannel as GuildChannel).edit(editOptions);
      }
      result.channelsUpdated.push(definition.name);
    } else {
      console.log(`    ✓ Channel unchanged: #${definition.name}`);
      result.unchanged.push(`channel:${definition.name}`);
    }
  }
}

/**
 * Check if a channel needs updating
 */
function checkChannelNeedsUpdate(
  channel: TextChannel | VoiceChannel,
  definition: ChannelDefinition,
  expectedCategory: CategoryChannel | null
): boolean {
  // Check parent category
  if (channel.parentId !== expectedCategory?.id) return true;

  // Check topic for text channels
  if (
    channel.type === ChannelType.GuildText &&
    definition.topic !== undefined &&
    (channel as TextChannel).topic !== definition.topic
  ) {
    return true;
  }

  return false;
}

/**
 * Sync all channels from config to Discord
 */
export async function syncChannels(
  guild: Guild,
  categories: CategoryDefinition[],
  dryRun: boolean = false
): Promise<ChannelSyncResult> {
  const result: ChannelSyncResult = {
    categoriesCreated: [],
    categoriesUpdated: [],
    channelsCreated: [],
    channelsUpdated: [],
    unchanged: [],
  };

  console.log('\n📁 Syncing channels...');

  // Sort categories by position
  const sortedCategories = [...categories].sort(
    (a, b) => a.position - b.position
  );

  for (const categoryDef of sortedCategories) {
    await syncCategory(guild, categoryDef, dryRun, result);
  }

  return result;
}
