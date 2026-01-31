import { Guild } from 'discord.js';
import { FullConfig } from '../types/config';
import { syncRoles, RoleSyncResult } from './roles';
import { syncChannels, ChannelSyncResult } from './channels';
import { syncEmojis, EmojiSyncResult } from './emojis';

export interface SyncOptions {
  roles?: boolean;
  channels?: boolean;
  emojis?: boolean;
  dryRun?: boolean;
}

export interface SyncResult {
  roles?: RoleSyncResult;
  channels?: ChannelSyncResult;
  emojis?: EmojiSyncResult;
}

/**
 * Main sync orchestrator - syncs all server components
 */
export async function syncServer(
  guild: Guild,
  config: FullConfig,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const {
    roles: syncRolesEnabled = true,
    channels: syncChannelsEnabled = true,
    emojis: syncEmojisEnabled = true,
    dryRun = false,
  } = options;

  const result: SyncResult = {};

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No changes will be made\n');
  }

  console.log(`\n🚀 Syncing server: ${guild.name}`);
  console.log('='.repeat(50));

  // Sync roles first (channels depend on roles for permissions)
  if (syncRolesEnabled) {
    result.roles = await syncRoles(guild, config.roles, dryRun);
  }

  // Sync channels
  if (syncChannelsEnabled) {
    result.channels = await syncChannels(guild, config.categories, dryRun);
  }

  // Sync emojis
  if (syncEmojisEnabled) {
    result.emojis = await syncEmojis(guild, config.emojis, dryRun);
  }

  // Print summary
  printSummary(result, dryRun);

  return result;
}

/**
 * Print a summary of sync operations
 */
function printSummary(result: SyncResult, dryRun: boolean): void {
  console.log('\n' + '='.repeat(50));
  console.log(dryRun ? '📋 Sync Preview Summary:' : '✅ Sync Complete Summary:');
  console.log('='.repeat(50));

  if (result.roles) {
    console.log('\nRoles:');
    console.log(`  Created: ${result.roles.created.length}`);
    console.log(`  Updated: ${result.roles.updated.length}`);
    console.log(`  Unchanged: ${result.roles.unchanged.length}`);
  }

  if (result.channels) {
    console.log('\nChannels:');
    console.log(`  Categories created: ${result.channels.categoriesCreated.length}`);
    console.log(`  Categories updated: ${result.channels.categoriesUpdated.length}`);
    console.log(`  Channels created: ${result.channels.channelsCreated.length}`);
    console.log(`  Channels updated: ${result.channels.channelsUpdated.length}`);
    console.log(`  Unchanged: ${result.channels.unchanged.length}`);
  }

  if (result.emojis) {
    console.log('\nEmojis:');
    console.log(`  Created: ${result.emojis.created.length}`);
    console.log(`  Unchanged: ${result.emojis.unchanged.length}`);
    if (result.emojis.errors.length > 0) {
      console.log(`  Errors: ${result.emojis.errors.length}`);
    }
  }

  console.log('');
}

export { syncRoles } from './roles';
export { syncChannels } from './channels';
export { syncEmojis } from './emojis';
