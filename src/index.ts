import 'dotenv/config';
import { Command } from 'commander';
import { createClient, loginClient, getGuild, destroyClient } from './client';
import { loadFullConfig, validateEnvironment } from './utils/config';
import { syncServer } from './sync';

const program = new Command();

program
  .name('discord-helper')
  .description('Discord server infrastructure-as-code management')
  .version('1.0.0');

program
  .command('sync')
  .description('Sync server configuration to Discord')
  .option('--roles', 'Sync roles only')
  .option('--channels', 'Sync channels only')
  .option('--emojis', 'Sync emojis only')
  .option('--dry-run', 'Preview changes without applying them')
  .action(async (options) => {
    try {
      validateEnvironment();

      const config = loadFullConfig();
      const client = createClient();

      console.log('🔌 Connecting to Discord...');
      await loginClient(client, process.env.DISCORD_TOKEN!);

      const guild = await getGuild(client, process.env.GUILD_ID!);

      // Determine what to sync
      const syncOptions = {
        roles: options.roles || (!options.roles && !options.channels && !options.emojis),
        channels: options.channels || (!options.roles && !options.channels && !options.emojis),
        emojis: options.emojis || (!options.roles && !options.channels && !options.emojis),
        dryRun: options.dryRun || false,
      };

      await syncServer(guild, config, syncOptions);

      destroyClient(client);
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('diff')
  .description('Preview changes without applying them (alias for sync --dry-run)')
  .option('--roles', 'Check roles only')
  .option('--channels', 'Check channels only')
  .option('--emojis', 'Check emojis only')
  .action(async (options) => {
    try {
      validateEnvironment();

      const config = loadFullConfig();
      const client = createClient();

      console.log('🔌 Connecting to Discord...');
      await loginClient(client, process.env.DISCORD_TOKEN!);

      const guild = await getGuild(client, process.env.GUILD_ID!);

      const syncOptions = {
        roles: options.roles || (!options.roles && !options.channels && !options.emojis),
        channels: options.channels || (!options.roles && !options.channels && !options.emojis),
        emojis: options.emojis || (!options.roles && !options.channels && !options.emojis),
        dryRun: true,
      };

      await syncServer(guild, config, syncOptions);

      destroyClient(client);
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate configuration files without connecting to Discord')
  .action(() => {
    try {
      console.log('🔍 Validating configuration...\n');

      const config = loadFullConfig();

      console.log('✓ Server config loaded');
      console.log(`  Name: ${config.server.name}`);
      console.log(`  Guild ID: ${config.server.guildId}`);

      console.log(`\n✓ Roles config loaded (${config.roles.length} roles)`);
      for (const role of config.roles) {
        console.log(`  - ${role.name} (${role.color})`);
      }

      console.log(`\n✓ Channels config loaded (${config.categories.length} categories)`);
      for (const category of config.categories) {
        console.log(`  📁 ${category.name}`);
        for (const channel of category.channels) {
          console.log(`    #${channel.name}`);
        }
      }

      console.log(`\n✓ Emojis config loaded (${config.emojis.length} emojis)`);

      console.log('\n✅ All configuration files are valid!');
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Validation error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Run CLI
program.parse();
