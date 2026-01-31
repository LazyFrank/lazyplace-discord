import { PermissionFlagsBits } from 'discord.js';

export interface ServerConfig {
  server: {
    name: string;
    guildId: string;
  };
}

export interface RoleDefinition {
  name: string;
  color: string;
  hoist: boolean;
  permissions: string[];
  mentionable?: boolean;
}

export interface RolesConfig {
  roles: RoleDefinition[];
}

export interface ChannelPermissions {
  [roleName: string]: string[];
}

export interface ChannelDefinition {
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'forum' | 'stage';
  topic?: string;
  permissions?: ChannelPermissions;
  nsfw?: boolean;
  slowmode?: number;
  userLimit?: number; // For voice channels
}

export interface CategoryDefinition {
  name: string;
  position: number;
  permissions?: ChannelPermissions;
  systemChannel?: string;
  channels: ChannelDefinition[];
}

export interface ChannelsConfig {
  categories: CategoryDefinition[];
}

export interface EmojiDefinition {
  name: string;
  file: string;
}

export interface EmojisConfig {
  emojis: EmojiDefinition[];
}

export interface FullConfig {
  server: ServerConfig['server'];
  roles: RoleDefinition[];
  categories: CategoryDefinition[];
  emojis: EmojiDefinition[];
}

// Permission name to Discord.js flag mapping
export const PERMISSION_MAP: Record<string, bigint> = {
  VIEW_CHANNEL: PermissionFlagsBits.ViewChannel,
  SEND_MESSAGES: PermissionFlagsBits.SendMessages,
  SEND_TTS_MESSAGES: PermissionFlagsBits.SendTTSMessages,
  MANAGE_MESSAGES: PermissionFlagsBits.ManageMessages,
  EMBED_LINKS: PermissionFlagsBits.EmbedLinks,
  ATTACH_FILES: PermissionFlagsBits.AttachFiles,
  READ_MESSAGE_HISTORY: PermissionFlagsBits.ReadMessageHistory,
  MENTION_EVERYONE: PermissionFlagsBits.MentionEveryone,
  USE_EXTERNAL_EMOJIS: PermissionFlagsBits.UseExternalEmojis,
  ADD_REACTIONS: PermissionFlagsBits.AddReactions,
  CONNECT: PermissionFlagsBits.Connect,
  SPEAK: PermissionFlagsBits.Speak,
  MUTE_MEMBERS: PermissionFlagsBits.MuteMembers,
  DEAFEN_MEMBERS: PermissionFlagsBits.DeafenMembers,
  MOVE_MEMBERS: PermissionFlagsBits.MoveMembers,
  USE_VAD: PermissionFlagsBits.UseVAD,
  PRIORITY_SPEAKER: PermissionFlagsBits.PrioritySpeaker,
  STREAM: PermissionFlagsBits.Stream,
  MANAGE_CHANNELS: PermissionFlagsBits.ManageChannels,
  MANAGE_ROLES: PermissionFlagsBits.ManageRoles,
  MANAGE_WEBHOOKS: PermissionFlagsBits.ManageWebhooks,
  CREATE_INSTANT_INVITE: PermissionFlagsBits.CreateInstantInvite,
  MANAGE_THREADS: PermissionFlagsBits.ManageThreads,
  CREATE_PUBLIC_THREADS: PermissionFlagsBits.CreatePublicThreads,
  CREATE_PRIVATE_THREADS: PermissionFlagsBits.CreatePrivateThreads,
  SEND_MESSAGES_IN_THREADS: PermissionFlagsBits.SendMessagesInThreads,
  USE_EXTERNAL_STICKERS: PermissionFlagsBits.UseExternalStickers,
  USE_APPLICATION_COMMANDS: PermissionFlagsBits.UseApplicationCommands,
};
