# Troubleshooting GitHub Projects v2

## Issue: "Project not found" but I can see it in the browser

### Symptoms
- Running `mcp_knowing-mcp_project-get` returns "Project #X not found"
- You can access the project at `https://github.com/orgs/{org}/projects/{number}`
- You successfully created issues in the same organization

### Root Cause: Token Permissions

**⚠️ IMPORTANT: The `project` scope is for CLASSIC Projects (v1), NOT Projects v2!**

**GitHub Projects v2 requires the `read:org` scope** on your Personal Access Token (PAT) for organization-level projects.

Even if you can:
- ✅ Create issues (`repo` scope)
- ✅ Have the `project` scope (this is for classic projects only!)
- ✅ View the project in your browser (uses your logged-in session)

Your API token **still won't work** for Projects v2 without `read:org` and SSO authorization.

### How GitHub's API Behaves

When your token lacks `project` scope:
- GraphQL returns `null` for `projectV2` queries (no error thrown)
- REST API `/orgs/{org}/projects` returns `[]` (empty array)
- The web UI works fine (uses browser authentication)

This makes it confusing to diagnose!

## Solution: Add `project` Scope to Your Token

### Step 1: Update Your GitHub Token

**Classic Personal Access Token (PAT):**

1. Go to: https://github.com/settings/tokens
2. Find your `knowing-mcp` token (or create a new one)
3. Click **Edit** (or **Generate new token** → **Classic**)
4. Ensure these scopes are checked:
   - ✅ **`repo`** - Full control of private repositories
   - ✅ **`read:org`** - Read org membership ⚠️ **REQUIRED for Projects v2!**
   - ⚠️ **`project`** - Only needed for classic Projects (v1), NOT v2
5. Click **Update token** (or **Generate token**)
6. **Copy the token** (you won't see it again!)

**Fine-grained Personal Access Token:**

1. Go to: https://github.com/settings/personal-access-tokens/new
2. Configure:
   - **Repository access**: Select repositories you need
   - **Organization permissions**:
     - **Projects**: Read-only (or Read and write) ⚠️ **REQUIRED!**
   - **Repository permissions**:
     - **Issues**: Read and write
     - **Contents**: Read-only
3. Click **Generate token**
4. **Copy the token**

### Step 2: Enable SSO (if your organization requires it)

If you're working with an **organization that enforces SAML SSO**:

1. Go to: https://github.com/settings/tokens
2. Find your token
3. Click **Configure SSO** next to your organization
4. Click **Authorize** for each organization

**Signs your org uses SSO:**
- You see "Authorize" buttons next to org names on the token page
- You get "Resource protected by organization SAML enforcement" errors

### Step 3: Update VS Code Settings

**macOS/Linux:**
- Press `Cmd + Shift + P` (macOS) or `Ctrl + Shift + P` (Linux/Windows)
- Type: "Preferences: Open User Settings (JSON)"

**Windows:**
- Press `Ctrl + Shift + P`
- Type: "Preferences: Open User Settings (JSON)"

Update your token:

```json
{
  "github.copilot.chat.mcpServers": {
    "knowing-mcp": {
      "command": "knowing-mcp",
      "env": {
        "GH_TOKEN": "ghp_YOUR_NEW_TOKEN_HERE",
        "AZURE_OPENAI_ENDPOINT": "...",
        "AZURE_OPENAI_API_KEY": "..."
      }
    }
  }
}
```

### Step 4: Restart VS Code

**Complete restart** (recommended):
- Quit VS Code completely
- Reopen it

**Quick reload** (faster):
- Press `Cmd + Shift + P` (macOS) or `Ctrl + Shift + P` (Windows/Linux)
- Type: "Developer: Reload Window"

## Verify the Fix

Try getting your project again:

```bash
mcp_knowing-mcp_project-get({
  owner: "Gullers-Grupp",  # or your org name
  number: 1
})
```

**Expected output:**
```
📋 Project: Maconomy BI
Owner: Gullers-Grupp (organization)
ID: PVT_kwDO...
URL: https://github.com/orgs/Gullers-Grupp/projects/1
Description: ...
```

## Still Not Working?

### Check Your Token Scopes

**Using curl:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -i https://api.github.com/user
```

Look for the `X-OAuth-Scopes` header:
```
X-OAuth-Scopes: repo, project, read:org
```

If you don't see `project` in that list, your token doesn't have the right scope.

### Test GraphQL Query Directly

**Using GitHub GraphQL Explorer** (uses your browser session):
1. Go to: https://docs.github.com/en/graphql/overview/explorer
2. Run this query:
   ```graphql
   query {
     organization(login: "YOUR_ORG") {
       projectV2(number: 1) {
         id
         title
         number
         url
       }
     }
   }
   ```
3. If this works but the MCP tool doesn't, it's a token issue

**Using curl with your token:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query":"query{organization(login:\"YOUR_ORG\"){projectV2(number:1){id title}}}"}' \
     https://api.github.com/graphql
```

If you get `{"data":{"organization":{"projectV2":null}}}`, your token lacks permission.

### Check Organization Settings

Some organizations restrict project visibility:

1. Go to: `https://github.com/orgs/YOUR_ORG/projects/1`
2. Click **⋯** (three dots) → **Settings**
3. Check **Visibility**:
   - If **Private**: Ensure you're an org member with access
   - If **Public**: Should work for anyone

## Understanding Projects v1 vs v2

| Feature | Classic Projects (v1) | Projects v2 |
|---------|----------------------|-------------|
| **API** | REST (`/projects`) | GraphQL (`projectV2`) |
| **URL** | `/projects/{id}` | `/projects/{number}` |
| **Scope** | `repo` | `project` |
| **Status** | Legacy | Current |

**How to tell which you have:**
- URL like `/orgs/X/projects/1` → **Projects v2** (this tool)
- URL like `/orgs/X/projects/123456` → Classic (v1)

## Common Error Messages

### "Could not resolve to a node with the global id"
**Cause:** Wrong project ID format or insufficient permissions  
**Fix:** Use `project-get` to retrieve the correct ID, ensure `project` scope

### "Project #1 not found for {org}"
**Cause:** Missing `project` scope on token  
**Fix:** Follow [Solution](#solution-add-project-scope-to-your-token) above

### "Resource protected by organization SAML enforcement"
**Cause:** Organization requires SSO, token not authorized  
**Fix:** Enable SSO for your token (see [Step 2](#step-2-enable-sso-if-your-organization-requires-it))

### GraphQL returns `{"organization": {"projectV2": null}}`
**Cause:** Token missing `project` scope or project doesn't exist  
**Fix:** 
1. Add `project` scope to token
2. Verify project number is correct
3. Check you have access to the project

## Related Documentation

- [GitHub Projects v2 Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects)
- [GitHub GraphQL API](https://docs.github.com/en/graphql)
- [Creating a Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Authorizing a PAT for SAML SSO](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on)

## Quick Reference

**Required Token Scopes:**
- `repo` - Repository access
- `read:org` - **Organization access (REQUIRED for Projects v2!)** ⚠️
- `project` - Only for classic Projects (v1), NOT needed for v2

**Minimum Fine-grained PAT Permissions:**
- Organization → Projects: Read-only (or Read and write)
- Repository → Issues: Read and write (for issue creation)
- Repository → Contents: Read-only

**Restart Required:**
After updating token in VS Code settings, you **must** restart VS Code or reload the window.
