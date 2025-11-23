# Contributing to cptrash

First off, thank you for considering contributing to cptrash! 🎉

This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Clear and descriptive title**
- **Steps to reproduce** the behavior
- **Expected behavior** - what you expected to happen
- **Actual behavior** - what actually happened
- **Environment details**:
  - Node.js version
  - Operating system
  - Browser used (if applicable)
  - cPanel version (if applicable)
- **Screenshots** (if applicable)
- **Error messages** or logs (if any)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Clear and descriptive title**
- **Detailed description** of the enhancement
- **Use case** - why is this enhancement useful?
- **Possible implementation** (if you have ideas)

### Pull Requests

1. **Fork the repository** and clone your fork
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
3. **Make your changes** following the coding standards below
4. **Test your changes** thoroughly
5. **Commit your changes** (pre-commit hooks will run automatically)
6. **Push to your fork** and open a Pull Request

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm (comes with Node.js)
- A Chromium-based browser installed
- Git

### Getting Started

1. **Fork and clone the repository:**

   ```bash
   git clone https://github.com/your-username/cptrash.git
   cd cptrash
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up Git hooks:**

   ```bash
   npm run prepare
   ```

   This will set up Husky pre-commit hooks automatically.

4. **Verify the setup:**
   ```bash
   npm run lint
   npm run format:check
   ```

## Coding Standards

### Code Style

- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings
- **Semicolons**: Always use semicolons
- **Line length**: Maximum 100 characters
- **Trailing commas**: Use in multiline objects/arrays

### Linting and Formatting

We use **ESLint** for code quality and **Prettier** for formatting.

**Before committing:**

```bash
# Check for linting errors
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting without changing files
npm run format:check
```

**Pre-commit hooks** will automatically run linting and formatting on staged files, but it's good practice to run these manually before committing.

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools

**Examples:**

```
feat: add support for custom trash paths
fix: resolve timeout issue on slow connections
docs: update README with new examples
style: format code with Prettier
refactor: simplify browser detection logic
```

### File Structure

```
cpanel-trash-delete/
├── .husky/              # Git hooks
├── .github/             # GitHub workflows (if applicable)
├── index.js             # Main application file
├── package.json         # Dependencies and scripts
├── README.md            # Project documentation
├── CHANGELOG.md         # Version history
├── CONTRIBUTING.md      # This file
├── LICENSE              # MIT License
└── .editorconfig        # Editor configuration
```

## Testing

Before submitting a PR, please:

1. **Test your changes** with different scenarios:
   - Test with different cPanel configurations
   - Test with various browser types
   - Test error handling
   - Test edge cases

2. **Run linting and formatting:**

   ```bash
   npm run lint
   npm run format:check
   ```

3. **Test the CLI** manually:
   ```bash
   npm start
   # or
   node index.js
   ```

## Pull Request Process

1. **Update CHANGELOG.md**:
   - Add your changes under `[Unreleased]`
   - Use appropriate categories (Added, Changed, Fixed, etc.)

2. **Ensure all checks pass**:
   - Linting passes
   - Formatting is correct
   - Code follows the style guide
   - No console errors

3. **Write a clear PR description**:
   - What changes were made?
   - Why were they made?
   - How were they tested?
   - Screenshots (if UI changes)

4. **Link related issues** (if applicable):
   - Use keywords like "Fixes #123" or "Closes #456"

5. **Request review**:
   - Wait for maintainer feedback
   - Address any requested changes

## Code Review

All submissions require review. We use GitHub pull requests for this purpose. The review process may include:

- Code quality checks
- Testing verification
- Documentation updates
- Style consistency

## Questions?

If you have questions about contributing, feel free to:

- Open an issue with the `question` label
- Check existing issues and discussions
- Review the README.md for project details

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to cptrash! 🙏
