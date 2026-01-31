# Discord Helper

Discord server infrastructure-as-code management system. Define your server's channels, roles, and permissions in YAML configuration files and sync them to Discord.

## Features

- **Declarative Configuration**: Define server structure in YAML files
- **Role Management**: Create and sync roles with colors and hierarchy
- **Channel Management**: Create categories and channels with proper permissions
- **Permission Overwrites**: Fine-grained control over who can see and access what
- **Dry Run Mode**: Preview changes before applying them
- **Emoji Support**: Upload and manage custom emojis (future)

## Setup

### Prerequisites

- Node.js 18+
- A Discord bot with the following permissions:
  - Manage Roles
  - Manage Channels
  - Manage Emojis and Stickers

### Installation

```bash
npm install
```

### Configuration

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Fill in your Discord bot token and guild ID in `.env`:

```
DISCORD_TOKEN=your_bot_token_here
GUILD_ID=your_server_id_here
```

3. Customize the configuration files in `config/`:
   - `server.yaml` - Server name and ID
   - `roles.yaml` - Role definitions
   - `channels.yaml` - Channel and category structure
   - `emojis.yaml` - Custom emoji definitions

## Usage

### Validate Configuration

Check that all config files are valid without connecting to Discord:

```bash
npm run dev validate
```

### Preview Changes (Dry Run)

See what changes would be made without applying them:

```bash
npm run diff
```

### Sync Everything

Apply all configuration to your Discord server:

```bash
npm run sync
```

### Sync Specific Components

```bash
# Sync only roles
npm run sync:roles

# Sync only channels
npm run sync:channels
```

## Configuration Reference

### roles.yaml

```yaml
roles:
  - name: "Role Name"
    color: "#FF0000"     # Hex color
    hoist: true          # Show separately in member list
    mentionable: false   # Allow @mentions
    permissions: []      # Base permissions (usually empty, use channel overwrites)
```

### channels.yaml

```yaml
categories:
  - name: "Category Name"
    position: 0
    permissions:
      "@everyone": []              # Empty = hide from this role
      "Role Name": [VIEW_CHANNEL]  # Grant specific permissions
    channels:
      - name: "channel-name"
        type: text                 # text, voice, announcement, forum, stage
        topic: "Channel description"
        permissions:               # Override category permissions
          "Role Name": [VIEW_CHANNEL, SEND_MESSAGES]
```

### Available Permissions

- `VIEW_CHANNEL`
- `SEND_MESSAGES`
- `READ_MESSAGE_HISTORY`
- `ADD_REACTIONS`
- `ATTACH_FILES`
- `EMBED_LINKS`
- `USE_EXTERNAL_EMOJIS`
- `CONNECT` (voice)
- `SPEAK` (voice)
- `STREAM` (voice)
- `MANAGE_MESSAGES`
- `MANAGE_CHANNELS`
- And more (see `src/types/config.ts`)

## Project Structure

```
discord-helper/
├── config/
│   ├── server.yaml       # Server settings
│   ├── roles.yaml        # Role definitions
│   ├── channels.yaml     # Channel structure
│   └── emojis.yaml       # Emoji definitions
├── assets/
│   └── emojis/           # Emoji image files
├── src/
│   ├── index.ts          # CLI entry point
│   ├── client.ts         # Discord client setup
│   ├── sync/
│   │   ├── index.ts      # Sync orchestrator
│   │   ├── roles.ts      # Role sync logic
│   │   ├── channels.ts   # Channel sync logic
│   │   └── emojis.ts     # Emoji sync logic
│   ├── utils/
│   │   ├── config.ts     # Config loader
│   │   └── permissions.ts
│   └── types/
│       └── config.ts     # TypeScript interfaces
├── .env.example
├── package.json
└── tsconfig.json
```

## How It Works

1. **Roles are synced first** - Channels depend on roles for permission overwrites
2. **Categories are created** - With their base permissions
3. **Channels are created** - Within categories, inheriting or overriding permissions
4. **Emojis are uploaded** - From the assets folder

The sync process is idempotent - running it multiple times will only make necessary changes.

## Integration with Vulkan

This system is designed to work with Vulkan for NFT verification:

1. **Roles created by this tool**: `Lazy`, `Lazy Legend`
2. **Vulkan assigns these roles** when users verify NFT ownership
3. **Permissions grant access**: Verified users see hidden categories

The `#verify` channel in the Onboarding category is where Vulkan operates.

## Safety Notes

- The tool does **not** delete roles or channels not in config (to prevent accidents)
- Use `--dry-run` to preview changes before applying
- Keep your `.env` file secret and never commit it to git
