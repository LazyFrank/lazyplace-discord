import { PermissionsBitField } from 'discord.js';
import { PERMISSION_MAP } from '../types/config';

/**
 * Convert an array of permission names to a Discord.js PermissionsBitField
 */
export function permissionNamesToFlags(permissionNames: string[]): bigint[] {
  const flags: bigint[] = [];

  for (const name of permissionNames) {
    const flag = PERMISSION_MAP[name];
    if (flag === undefined) {
      console.warn(`Warning: Unknown permission name: ${name}`);
      continue;
    }
    flags.push(flag);
  }

  return flags;
}

/**
 * Create a PermissionsBitField from an array of permission names
 */
export function createPermissionsBitField(
  permissionNames: string[]
): PermissionsBitField {
  const flags = permissionNamesToFlags(permissionNames);
  return new PermissionsBitField(flags);
}

/**
 * Convert a hex color string to a Discord-compatible integer
 */
export function hexToColorInt(hex: string): number {
  // Remove # if present
  const cleaned = hex.replace('#', '');
  return parseInt(cleaned, 16);
}

/**
 * Compare two arrays of permission names for equality
 */
export function permissionsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}
