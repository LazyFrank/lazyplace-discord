import { Guild, Role, PermissionFlagsBits } from 'discord.js';
import { RoleDefinition } from '../types/config';
import { hexToColorInt } from '../utils/permissions';

export interface RoleSyncResult {
  created: string[];
  updated: string[];
  deleted: string[];
  unchanged: string[];
}

/**
 * Compare a role definition with an existing Discord role
 */
function roleNeedsUpdate(role: Role, definition: RoleDefinition): boolean {
  const expectedColor = hexToColorInt(definition.color);

  if (role.color !== expectedColor) return true;
  if (role.hoist !== definition.hoist) return true;
  if (role.mentionable !== (definition.mentionable ?? false)) return true;

  return false;
}

/**
 * Sync roles from config to Discord
 */
export async function syncRoles(
  guild: Guild,
  roleDefinitions: RoleDefinition[],
  dryRun: boolean = false
): Promise<RoleSyncResult> {
  const result: RoleSyncResult = {
    created: [],
    updated: [],
    deleted: [],
    unchanged: [],
  };

  console.log('\n📋 Syncing roles...');

  // Get existing roles from the guild
  const existingRoles = await guild.roles.fetch();
  const existingRoleMap = new Map<string, Role>();

  for (const [, role] of existingRoles) {
    existingRoleMap.set(role.name, role);
  }

  // Managed role names from config
  const configRoleNames = new Set(roleDefinitions.map((r) => r.name));

  // Process each role in the config
  for (const definition of roleDefinitions) {
    const existingRole = existingRoleMap.get(definition.name);

    if (!existingRole) {
      // Create new role
      console.log(`  ➕ Creating role: ${definition.name}`);
      if (!dryRun) {
        try {
          await guild.roles.create({
            name: definition.name,
            color: hexToColorInt(definition.color),
            hoist: definition.hoist,
            mentionable: definition.mentionable ?? false,
            reason: 'Synced from config',
          });
        } catch (error: any) {
          console.error(`    ❌ Failed to create role: ${error.message}`);
          if (error.code === 50013) {
            console.error('    💡 Ensure the bot role has "Manage Roles" permission');
            console.error('    💡 The bot role must be HIGHER than roles it creates');
          }
          throw error;
        }
      }
      result.created.push(definition.name);
    } else if (roleNeedsUpdate(existingRole, definition)) {
      // Update existing role
      console.log(`  🔄 Updating role: ${definition.name}`);
      if (!dryRun) {
        await existingRole.edit({
          color: hexToColorInt(definition.color),
          hoist: definition.hoist,
          mentionable: definition.mentionable ?? false,
          reason: 'Synced from config',
        });
      }
      result.updated.push(definition.name);
    } else {
      console.log(`  ✓ Role unchanged: ${definition.name}`);
      result.unchanged.push(definition.name);
    }
  }

  // Note: We don't auto-delete roles not in config to avoid accidents
  // Only roles explicitly managed by this config are touched

  // Reposition roles (higher position = higher in hierarchy)
  if (!dryRun && result.created.length > 0) {
    console.log('  📊 Repositioning roles...');
    try {
      const freshRoles = await guild.roles.fetch();
      const botMember = await guild.members.fetchMe();
      const botHighestPosition = botMember.roles.highest.position;

      // Position roles in reverse order of config (first in config = highest)
      const positions: { role: string; position: number }[] = [];
      let position = 1; // Start above @everyone

      for (let i = roleDefinitions.length - 1; i >= 0; i--) {
        const roleName = roleDefinitions[i].name;
        const role = freshRoles.find((r) => r.name === roleName);
        // Only reposition roles below bot's highest role
        if (role && !role.managed && role.position < botHighestPosition) {
          positions.push({ role: role.id, position });
          position++;
        }
      }

      if (positions.length > 0) {
        await guild.roles.setPositions(positions);
      }
    } catch (error) {
      console.log('  ⚠️  Could not reposition roles (drag them manually in Discord)');
    }
  }

  return result;
}

/**
 * Get a role by name, creating it if necessary
 */
export async function getOrCreateRole(
  guild: Guild,
  roleName: string
): Promise<Role | null> {
  const roles = await guild.roles.fetch();
  let role = roles.find((r) => r.name === roleName);

  if (!role && roleName !== '@everyone') {
    console.log(`    Creating missing role: ${roleName}`);
    role = await guild.roles.create({
      name: roleName,
      reason: 'Created for channel permissions',
    });
  }

  return role || null;
}
