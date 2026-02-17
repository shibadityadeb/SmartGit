# Contributing to SmartGit

First off, thank you for considering contributing to SmartGit! It's people like you that make SmartGit such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## Code of Conduct

This project and everyone participating in it is governed by respect and professionalism. By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bugfix
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- Git
- npm or yarn

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/smartgit.git
cd smartgit

# Install dependencies
npm install

# Link for local testing
npm link

# Test the CLI
smartgit --help
```

### Project Structure

```
smartgit/
├── bin/
│   └── smartgit.js          # CLI entry point
├── lib/
│   ├── analyzer.js          # Change detection and analysis
│   ├── suggester.js         # Commit message generation
│   ├── runner.js            # Git command execution
│   └── config.js            # Configuration management
├── tests/                   # Future: test files
├── package.json
└── README.md
```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Environment details** (OS, Node version, Git version)
- **Screenshots** (if applicable)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List examples** of how it would be used

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed

## Coding Standards

### JavaScript Style Guide

We follow modern JavaScript best practices:

```javascript
// ✅ Good
export async function analyzeChanges(repoPath = process.cwd()) {
  const git = simpleGit(repoPath);
  // ...
}

// ❌ Bad
export async function analyzeChanges(repoPath) {
  repoPath = repoPath || process.cwd();
  var git = simpleGit(repoPath);
  // ...
}
```

### Key Principles

1. **Use ES Modules** - `import/export` not `require/module.exports`
2. **Async/Await** - Use async/await instead of promises or callbacks
3. **Const/Let** - Never use `var`
4. **Descriptive Names** - Use clear, meaningful variable and function names
5. **Comments** - Add comments for complex logic
6. **Error Handling** - Always handle errors gracefully
7. **Modular Design** - Keep functions focused and reusable

### File Organization

- **One module per file**
- **Group related functions**
- **Export with named exports**
- **Keep files under 300 lines when possible**

### Documentation

- **JSDoc comments** for all exported functions
- **Inline comments** for complex logic
- **README updates** for new features
- **Examples** in EXAMPLES.md for new functionality

Example:

```javascript
/**
 * Analyzes the current Git repository status and changes
 * @param {string} repoPath - Path to the Git repository
 * @returns {Promise<Object>} Analysis result with changes and metadata
 * @throws {Error} If not a valid git repository
 */
export async function analyzeChanges(repoPath = process.cwd()) {
  // Implementation
}
```

## Commit Messages

We use SmartGit's own conventions (Conventional Commits):

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(suggester): add AI-powered commit message generation
fix(analyzer): resolve issue with renamed file detection
docs: update installation instructions
refactor(runner): simplify git push error handling
test(analyzer): add unit tests for file categorization
chore: update dependencies
```

### Guidelines

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests when applicable

## Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-new-feature
   ```

2. **Make your changes**:
   - Follow coding standards
   - Add tests if applicable
   - Update documentation

3. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat(scope): add new feature"
   ```

4. **Push to your fork**:
   ```bash
   git push origin feat/my-new-feature
   ```

5. **Open a Pull Request**:
   - Use a clear title
   - Describe your changes in detail
   - Link related issues
   - Add screenshots for UI changes

6. **Address review comments**:
   - Be responsive to feedback
   - Make requested changes
   - Push updates to the same branch

7. **Wait for approval and merge**

### PR Checklist

- [ ] My code follows the project's coding standards
- [ ] I have added/updated documentation
- [ ] I have added/updated examples if needed
- [ ] My changes generate no new errors or warnings
- [ ] I have tested my changes locally
- [ ] My commit messages follow the convention
- [ ] I have updated the CHANGELOG.md (if applicable)

## Testing

Currently, SmartGit uses manual testing. We plan to add automated tests in the future.

### Manual Testing

Test your changes by:

1. **Creating a test repository**:
   ```bash
   mkdir test-repo
   cd test-repo
   git init
   git remote add origin https://github.com/user/test-repo.git
   ```

2. **Making test changes**:
   ```bash
   touch file1.js file2.md
   echo "test" > file1.js
   ```

3. **Running SmartGit**:
   ```bash
   smartgit push
   ```

4. **Testing edge cases**:
   - No changes
   - Merge conflicts
   - No remote
   - Different file types
   - Large number of files

### Future: Automated Testing

We plan to add:
- Unit tests (Jest/Mocha)
- Integration tests
- CI/CD pipeline
- Code coverage reports

## Questions?

Feel free to:
- Open an issue for questions
- Start a discussion
- Reach out to maintainers

## Recognition

Contributors will be:
- Listed in CHANGELOG.md
- Credited in release notes
- Added to CONTRIBUTORS.md (future)

Thank you for contributing to SmartGit! 🚀

---

**Happy Coding!**
