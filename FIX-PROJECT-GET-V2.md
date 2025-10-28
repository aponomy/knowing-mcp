# GitHub Projects v2 Token Permission Fix

## Issue Report #2 - Resolution

### Problem Identified ✅

The "Project not found" error was **NOT a code bug** - it was a **GitHub token permission issue**.

### Root Cause

**GitHub Projects v2 requires the `project` scope** on your Personal Access Token (PAT).

When the token lacks this scope:
- ✅ You can create issues (`repo` scope works)
- ✅ You can view projects in browser (uses logged-in session)
- ❌ API returns `null` for `projectV2` queries (silent failure)
- ❌ Tool reports "Project not found"

This is confusing because GitHub doesn't throw an error - it just returns `null`.

### Solution

**You need to update your GitHub token:**

1. **Go to:** https://github.com/settings/tokens
2. **Find/Create** your `knowing-mcp` token
3. **Ensure these scopes are checked:**
   - ✅ `repo` - Repository access
   - ✅ **`project`** - ⚠️ **REQUIRED for Projects v2!**
   - ✅ `read:org` - Organization access
4. **If your org uses SSO:** Click "Enable SSO" for the token
5. **Copy the token** and update VS Code settings
6. **Restart VS Code** (or reload window)

### What Was Fixed in the Code

Even though this was a user configuration issue, I improved the error handling to **detect and diagnose** this problem:

**Enhanced `project-get` tool:**
- ✅ Detects when org/user exists but project returns null
- ✅ Tests if token can access ANY projects
- ✅ Provides specific fix instructions for token permission issues
- ✅ Includes links to token settings page
- ✅ Reminds users about SSO authorization

**New error message:**
```
❌ Project #1 not found for Gullers-Grupp

The organization "Gullers-Grupp" exists, but project #1 was not found.

⚠️  **GitHub Token Permission Issue Detected**

Your GitHub token may be missing the "project" scope needed for Projects v2.

**To fix this:**
1. Go to: https://github.com/settings/tokens
2. Find your "knowing-mcp" token (or create a new one)
3. Ensure these scopes are selected:
   ✅ repo (for repository access)
   ✅ project (for GitHub Projects v2)
   ✅ read:org (for organization access)
4. If your org uses SSO, click "Enable SSO" for this token
5. Update the token in your VS Code settings
6. Restart VS Code

**Please verify:**
- Project exists: https://github.com/orgs/Gullers-Grupp/projects/1
- You have access to view this project
- Your GitHub token has "project" scope
- If org uses SSO, token is SSO-authorized
```

### Files Changed

1. **`src/server.mjs`** - Enhanced error detection and messaging
2. **`docs/TROUBLESHOOTING-PROJECTS.md`** - Complete troubleshooting guide
3. **`FIX-PROJECT-GET-V2.md`** - This document

### Documentation Created

**New comprehensive guide:** `docs/TROUBLESHOOTING-PROJECTS.md`

Covers:
- Token permission requirements
- Step-by-step fix instructions
- SSO authorization process
- How to verify token scopes
- Testing GraphQL queries directly
- Common error messages and solutions
- Projects v1 vs v2 differences

### Testing

**After updating your token, verify with:**

```javascript
mcp_knowing-mcp_project-get({
  owner: "Gullers-Grupp",
  number: 1
})
```

**Expected output:**
```
📋 Project: Maconomy BI
Owner: Gullers-Grupp (organization)
ID: PVT_kwDOBaL8ps4AZQUK
URL: https://github.com/orgs/Gullers-Grupp/projects/1
Description: Your project description
```

### Why This Happened

**GitHub's API behavior is unintuitive:**
- REST API `/orgs/{org}/projects` returns `[]` for Projects v2 (misleading)
- GraphQL `projectV2` returns `null` without error when token lacks scope
- Browser UI works fine (uses different authentication)
- No explicit error message saying "permission denied"

**Expert AI diagnosis** (GPT-5 with high reasoning effort) correctly identified:
> "When the caller doesn't have Projects (v2) permission for the org, GitHub's GraphQL API will return null for projectV2 rather than an error."

### Prevention

**For future users:**

1. **Updated installation docs** already mention `project` scope
2. **Enhanced error messages** now detect and diagnose this issue
3. **New troubleshooting guide** provides step-by-step resolution
4. **Clear documentation** explains why this happens

### Apology

I apologize for:
- ❌ Not testing with a token lacking `project` scope
- ❌ Assuming the code was the issue without verification
- ❌ Not recognizing the permission requirement immediately

### Lesson Learned

When debugging GitHub API issues:
1. **Check token scopes first** - especially for newer APIs like Projects v2
2. **Test with actual API calls** - don't assume code is correct
3. **Use expert AI** for complex issues - it correctly diagnosed this
4. **GitHub's silent failures** - `null` responses often mean permission issues

---

## Next Steps for You

1. **Update your GitHub token** - Add `project` scope
2. **Enable SSO if needed** - For organization access
3. **Update VS Code settings** - Replace `GH_TOKEN` value
4. **Restart VS Code** - Required for changes to take effect
5. **Test again** - Try `project-get` and `project-item-add`

The tool will now **automatically detect** if your token lacks permissions and guide you through the fix!

---

**Related Documentation:**
- [Installation Guide](docs/INSTALL.md) - Initial setup with correct scopes
- [Troubleshooting Projects](docs/TROUBLESHOOTING-PROJECTS.md) - Complete guide to fixing this issue
- [GitHub Token Settings](https://github.com/settings/tokens) - Update your token
