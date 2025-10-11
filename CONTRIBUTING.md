# Contributing to knowing-mcp

Thank you for your interest in contributing to knowing-mcp! 🎉

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/Gullers-Grupp/knowing-mcp/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, Node version, VS Code version)
   - Any error messages or logs

### Suggesting Features

1. Check [Issues](https://github.com/Gullers-Grupp/knowing-mcp/issues) for existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use case / why it's needed
   - Example usage if possible

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test your changes thoroughly
5. Commit with clear messages: `git commit -m "Add feature: description"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Create a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/knowing-mcp.git
cd knowing-mcp

# Install dependencies
npm install

# Run tests
npm test

# Start in development mode
npm run dev
```

## Code Style

- Use ES modules (`import`/`export`)
- Follow existing code formatting
- Add comments for complex logic
- Keep functions focused and small
- Handle errors gracefully

## Testing

Before submitting a PR:

```bash
# Run the test suite
npm test

# Test in a real workspace
node src/server.mjs
# (Configure in VS Code and test with Copilot)
```

## Commit Message Guidelines

- Use present tense: "Add feature" not "Added feature"
- Use imperative mood: "Move cursor to..." not "Moves cursor to..."
- Reference issues: "Fix #123: Description"
- Keep first line under 72 characters

## Questions?

Feel free to open an issue for any questions or clarifications!

## Code of Conduct

Be respectful, constructive, and collaborative. We're all here to make this tool better!
