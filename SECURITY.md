# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by emailing:
- **Email**: [security@gullers.com](mailto:security@gullers.com)

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include:
- Type of issue (e.g., credential exposure, code injection, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Security Best Practices

When using knowing-mcp:

1. **Never commit credentials to version control**
   - Use `.gitignore` to exclude `.env` files
   - Store tokens in VS Code User Settings or `~/.knowing-mcp.env`

2. **Secure your config file**
   ```bash
   chmod 600 ~/.knowing-mcp.env
   ```

3. **Use minimal token scopes**
   - GitHub: Only grant necessary permissions
   - Rotate tokens regularly

4. **Keep dependencies updated**
   ```bash
   npm update
   npm audit
   ```

5. **Review VS Code settings**
   - User Settings may be synced - ensure credentials are safe
   - Consider using environment variables instead

## Known Security Considerations

- GitHub tokens are stored in plaintext in VS Code settings or config files
- Tokens are passed to the Node.js process via environment variables
- The server runs locally and doesn't expose any network services
- All API calls use official SDKs with HTTPS

## Disclosure Policy

We follow a coordinated disclosure policy:
1. Security researcher reports vulnerability privately
2. We confirm and develop a fix
3. We release the fix in a new version
4. Public disclosure after fix is available
