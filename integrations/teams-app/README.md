# OKRunit Teams App

Microsoft Teams bot integration for OKRunit. Delivers approval request notifications as interactive Adaptive Cards and handles approve/reject actions directly from Teams.

## Prerequisites

- An Azure account with access to Azure Active Directory
- The OKRunit web app deployed and accessible at a public URL (e.g., `https://www.okrunit.com`)

## Setup Instructions

### 1. Create an Azure Bot Service Registration

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Create a resource** > search for **Azure Bot**
3. Fill in the details:
   - **Bot handle**: `OKRunit`
   - **Subscription**: Select your Azure subscription
   - **Resource group**: Create new or select existing
   - **Pricing tier**: F0 (Free) for testing, S1 for production
   - **Microsoft App ID**: Select **Create new Microsoft App ID**
4. Click **Create**

### 2. Configure the Bot Messaging Endpoint

1. In the Azure Portal, navigate to your Bot resource
2. Go to **Configuration**
3. Set the **Messaging endpoint** to:
   ```
   https://www.okrunit.com/api/teams/interact
   ```
4. Note the **Microsoft App ID** -- this is your `TEAMS_CLIENT_ID`
5. Under **Microsoft App ID**, click **Manage** to go to the App Registration
6. Under **Certificates & secrets**, create a new client secret
7. Copy the secret value -- this is your `TEAMS_CLIENT_SECRET`

### 3. Configure Environment Variables

Add the following to your `.env.local` (or production environment):

```env
TEAMS_CLIENT_ID=<your-microsoft-app-id>
TEAMS_CLIENT_SECRET=<your-client-secret>
TEAMS_TENANT_ID=<your-azure-tenant-id>
```

The tenant ID can be found in **Azure Active Directory** > **Overview**.

### 4. Enable the Teams Channel

1. In the Azure Portal, go to your Bot resource
2. Click **Channels**
3. Select **Microsoft Teams**
4. Accept the terms and click **Apply**

### 5. Create App Icons

Before packaging, you need to create two icon files in this directory:

- **`color.png`** -- 192x192 pixel full-color icon (used in the Teams app store and chat)
- **`outline.png`** -- 32x32 pixel transparent outline icon (used in the Teams activity bar)

These should represent the OKRunit brand. The color icon uses `#4F46E5` (indigo) as the accent color.

### 6. Package the Teams App for Sideloading

Create a ZIP file containing the three required files:

```bash
cd integrations/teams-app
zip okrunit-teams-app.zip manifest.json color.png outline.png
```

### 7. Upload to Your Organization

#### Option A: Sideload for Testing

1. Open Microsoft Teams
2. Click **Apps** in the left sidebar
3. Click **Manage your apps** at the bottom
4. Click **Upload an app** > **Upload a custom app**
5. Select the `okrunit-teams-app.zip` file
6. Click **Add** to install to a team or chat

#### Option B: Publish to Your Org's App Catalog

1. Go to the [Teams Admin Center](https://admin.teams.microsoft.com)
2. Navigate to **Teams apps** > **Manage apps**
3. Click **Upload new app**
4. Select the `okrunit-teams-app.zip` file
5. The app will appear in your organization's app catalog

### 8. Add the Bot to a Channel

1. In a Teams channel, click the **+** to add a tab or use the **...** menu
2. Search for **OKRunit**
3. Add the bot to the desired channel
4. When the bot is added, it will automatically register the conversation reference for proactive messaging

## How It Works

1. **Notifications**: When an approval request is created in OKRunit, the bot sends an Adaptive Card to configured Teams channels with Approve/Reject buttons.

2. **Interactive Actions**: When a user clicks Approve or Reject, Teams sends the action data to the `/api/teams/interact` endpoint. The bot prompts for an optional or required reason (based on org policy), then applies the decision.

3. **Proactive Messaging**: The bot stores conversation references when added to teams/channels via the `/api/v1/messaging/teams/bot-install` endpoint. This enables sending notifications to channels without requiring a prior user interaction.

## Architecture

```
Teams Client
  |
  |-- (Bot added to channel) --> POST /api/v1/messaging/teams/bot-install
  |                                   |
  |                                   +--> Stores conversation reference
  |
  |-- (User clicks button)   --> POST /api/teams/interact
  |                                   |
  |                                   +--> Verifies Bot Framework JWT
  |                                   +--> Processes approve/reject
  |                                   +--> Returns updated Adaptive Card
  |
  |-- (Proactive notification) <-- Bot sends via Bot Framework REST API
```

## Bot Framework Authentication

The interact endpoint supports two authentication modes:

1. **Bot Framework JWT** -- Standard Microsoft Bot Framework token validation for production use. The bot validates the `Authorization: Bearer <token>` header against Microsoft's OpenID metadata.

2. **HMAC Signature** -- Legacy mode using `TEAMS_SIGNING_SECRET` for backward compatibility with webhook-based setups.

## Troubleshooting

- **Bot not responding**: Verify the messaging endpoint URL is correct and publicly accessible
- **Authentication failures**: Ensure `TEAMS_CLIENT_ID` and `TEAMS_CLIENT_SECRET` match your Azure Bot registration
- **Cards not rendering**: Check that the Adaptive Card schema version (1.4) is supported by your Teams client
- **Proactive messages failing**: Ensure the bot has been added to the channel and the conversation reference is stored
