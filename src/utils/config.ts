import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import {
  ServerConfig,
  RolesConfig,
  ChannelsConfig,
  EmojisConfig,
  FullConfig,
} from '../types/config';

const CONFIG_DIR = path.join(process.cwd(), 'config');

/**
 * Interpolate environment variables in a string
 * Replaces ${VAR_NAME} with the value of process.env.VAR_NAME
 */
function interpolateEnvVars(value: string): string {
  return value.replace(/\$\{(\w+)\}/g, (match, varName) => {
    const envValue = process.env[varName];
    if (envValue === undefined) {
      console.warn(`Warning: Environment variable ${varName} is not defined`);
      return match;
    }
    return envValue;
  });
}

/**
 * Recursively interpolate environment variables in an object
 */
function interpolateObject<T>(obj: T): T {
  if (typeof obj === 'string') {
    return interpolateEnvVars(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => interpolateObject(item)) as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateObject(value);
    }
    return result as T;
  }
  return obj;
}

/**
 * Load and parse a YAML config file
 */
function loadYamlFile<T>(filename: string): T {
  const filePath = path.join(CONFIG_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Config file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = yaml.parse(content) as T;
  return interpolateObject(parsed);
}

/**
 * Load the server configuration
 */
export function loadServerConfig(): ServerConfig {
  return loadYamlFile<ServerConfig>('server.yaml');
}

/**
 * Load the roles configuration
 */
export function loadRolesConfig(): RolesConfig {
  return loadYamlFile<RolesConfig>('roles.yaml');
}

/**
 * Load the channels configuration
 */
export function loadChannelsConfig(): ChannelsConfig {
  return loadYamlFile<ChannelsConfig>('channels.yaml');
}

/**
 * Load the emojis configuration
 */
export function loadEmojisConfig(): EmojisConfig {
  return loadYamlFile<EmojisConfig>('emojis.yaml');
}

/**
 * Load all configuration files and merge into a single object
 */
export function loadFullConfig(): FullConfig {
  const serverConfig = loadServerConfig();
  const rolesConfig = loadRolesConfig();
  const channelsConfig = loadChannelsConfig();
  const emojisConfig = loadEmojisConfig();

  return {
    server: serverConfig.server,
    roles: rolesConfig.roles,
    categories: channelsConfig.categories,
    emojis: emojisConfig.emojis || [],
  };
}

/**
 * Validate that required environment variables are set
 */
export function validateEnvironment(): void {
  const required = ['DISCORD_TOKEN', 'GUILD_ID'];
  const missing = required.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Copy .env.example to .env and fill in the values.'
    );
  }
}
