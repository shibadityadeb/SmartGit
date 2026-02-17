# 🚀 SmartGit

> A production-ready Node.js CLI tool that helps developers write better Git commit messages and automate push workflows.

SmartGit analyzes your Git repository changes **since the last commit (HEAD)**, intelligently suggests commit messages following Conventional Commits format, and automates the complete git workflow (add, commit, push) with interactive confirmation.

## ✨ Features

### Core Features
- 🔍 **HEAD-Based Analysis** - Analyzes ONLY changes since the last commit (v2.0)
- 💡 **Smart Commit Messages** - Generates meaningful messages from actual code changes
- 📝 **Conventional Commits** - Follows industry-standard format (feat, fix, refactor, docs, test, chore)
- ⚡ **Automated Workflow** - Executes `git add`, `git commit`, and `git push` in one command
- 🎯 **Interactive Prompts** - Confirms actions and allows message editing
- 📊 **Line Statistics** - Shows precise change metrics (+additions, -deletions)

### Analysis Modes (v2.0)
- 🎚️ **--all** - Analyze both staged and unstaged changes (default)
- 📦 **--staged** - Analyze only staged changes
- 📝 **--unstaged** - Analyze only working tree changes

### Additional Features
- 🛡️ **Error Handling** - Detects conflicts, handles edge cases, provides clear error messages
- 🌈 **Beautiful CLI** - Colored output with intuitive visual feedback
- 🔄 **Cross-Platform** - Works seamlessly on macOS, Linux, and Windows
- 🎯 **First Commit Detection** - Special handling for repositories with no HEAD

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g smartgit-cli
```

### Local Installation

```bash
npm install smartgit-cli
npx smartgit push
```

### From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/smartgit.git
cd smartgit

# Install dependencies
npm install

# Link globally
npm link

# Now you can use smartgit anywhere
smartgit push
```

## 🚀 Quick Start

Navigate to any Git repository and run:

```bash
smartgit push
```

That's it! SmartGit will:
1. ✅ Check for conflicts
2. 📊 Analyze your changes
3. 💡 Suggest a commit message
4. 🤔 Ask for your confirmation
5. 🚀 Execute git add, commit, and push

## 📖 Usage

### Main Command: `smartgit push`

Analyzes changes since the last commit, suggests a commit message, and executes the git workflow:

```bash
# Analyze all changes (default)
smartgit push

# Analyze only staged changes
smartgit push --staged

# Analyze only unstaged changes
smartgit push --unstaged
```

### Analysis Modes (v2.0)

#### All Changes (Default)
```bash
smartgit push
# or explicitly:
smartgit push --all
```
Analyzes both staged and unstaged changes since HEAD.

#### Staged Changes Only
```bash
smartgit push --staged
```
Analyzes only changes that have been staged with `git add`. Perfect for incremental commits.

#### Unstaged Changes Only
```bash
smartgit push --unstaged
```
Analyzes only working tree changes that haven't been staged yet.

### Interactive Flow Example:

```
🚀 SmartGit - Intelligent Git Automation

Checking for conflicts...
Analyzing all changes since last commit...

Analysis scope: all changes since last commit

📊 Changes Summary:
   3 file(s) changed: 2 modified, 1 created (+42, -15)

   Modified:
     ~ src/index.js
     ~ package.json
   Created:
     + README.md

📝 Suggested Commit Message:
   feat(docs): add README

Current branch: main
Remote: origin (https://github.com/user/repo.git)

? What would you like to do?
  ✓ Use this message and push
  ✎ Edit the message
  ✕ Cancel

⚙️  Executing Git workflow...

✓ Staged all changes
✓ Committed: feat(docs): add README
  Commit hash: a1b2c3d
✓ Successfully pushed to origin/main

🎉 All done! Your changes have been pushed successfully.
```

### Additional Command: `smartgit info`

Display current repository information:

```bash
smartgit info
```

**Output Example:**

```
📍 Repository Information

Branch:
  Current: main
  Tracking: origin/main

Remotes:
  origin: https://github.com/user/repo.git

Changes:
  3 file(s) changed: 2 modified, 1 created
```

## 🎯 How It Works

### 1. HEAD-Based Change Detection (v2.0)

SmartGit analyzes **ONLY changes since the last commit** using:
- `git diff HEAD` - Detects all changes since last commit
- `git diff --cached HEAD` - For staged-only mode
- `git status --porcelain` - Reliable file status parsing

**What this means:**
- ✅ Commit messages generated from fresh changes only
- ✅ No consideration of historical commits
- ✅ Precise line-level change tracking
- ✅ Deterministic, reproducible results

**Detected Changes:**
- ✅ Modified files
- ✅ Created files
- ✅ Deleted files
- ✅ Renamed files
- ✅ Line additions (+)
- ✅ Line deletions (-)

### 2. File Categorization

Files are automatically categorized based on their paths and extensions:
- 📚 **docs**: `.md`, `.txt`, README files
- 🧪 **test**: `.test.js`, `.spec.ts`, `__tests__/` directory
- ⚙️ **config**: `.json`, `.yml`, `.yaml`, configuration files
- 🎨 **style**: `.css`, `.scss`, `.sass`
- 💻 **source**: All other code files

### 3. Commit Type Detection

SmartGit determines the appropriate commit type based on:

| Type | Usage |
|------|-------|
| `feat` | New features or additions |
| `fix` | Bug fixes |
| `refactor` | Code refactoring |
| `docs` | Documentation changes |
| `test` | Test files |
| `style` | Style changes |
| `chore` | Configuration, build, or tooling changes |

### 4. Commit Message Generation

Messages follow the Conventional Commits format:

```
<type>(<scope>): <description>

Examples:
- feat(auth): add user login
- fix(api): resolve timeout issue
- docs: update installation guide
- refactor(utils): improve error handling
```

## 🛠️ Configuration

SmartGit works out of the box with sensible defaults. Configuration options are defined in [`lib/config.js`](lib/config.js):

```javascript
{
  maxFilesToShow: 10,           // Maximum files to display
  defaultCommitType: 'chore',   // Fallback commit type
  // ... more options
}
```

### Future: `.smartgitrc` (Phase 2)

In the future, you'll be able to customize SmartGit with a `.smartgitrc` file:

```json
{
  "commitTypes": ["feat", "fix", "refactor"],
  "scope": "auto",
  "maxFiles": 15
}
```

## 📁 Project Structure

```
smartgit/
├── bin/
│   └── smartgit.js          # CLI entry point
├── lib/
│   ├── analyzer.js          # Change detection and analysis
│   ├── suggester.js         # Commit message generation
│   ├── runner.js            # Git command execution
│   └── config.js            # Configuration management
├── package.json
├── README.md
└── .gitignore
```

## 🔧 Development

### Prerequisites

- Node.js >= 18.0.0
- Git installed and configured
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/smartgit.git
cd smartgit

# Install dependencies
npm install

# Link for local development
npm link

# Test the CLI
smartgit push
```

### Testing Locally

```bash
# Navigate to any git repository
cd /path/to/your/project

# Run SmartGit
smartgit push
```

## 🚨 Error Handling

SmartGit handles common error scenarios:

### No Changes
```
ℹ No changes detected in the repository
```

### Merge Conflicts
```
✖ You have unresolved merge conflicts. Please resolve them before committing.
```

### Not a Git Repository
```
✖ Not a git repository. Please run this command inside a git repository.
```

### No Remote Configured
```
⚠ No remote repository configured. Commit created but not pushed.
```

### Push Authentication Issues
```
⚠ Commit created but push failed. You may need to check authentication.
  You can manually push using: git push
```

## 🌟 Examples

### Example 1: Adding a new feature

```bash
# You created new files: src/auth.js, src/login.js
$ smartgit push

📝 Suggested Commit Message:
   feat(auth): add new features

? What would you like to do? ✓ Use this message and push
```

### Example 2: Fixing a bug

```bash
# You modified: src/bugfix.js
$ smartgit push

📝 Suggested Commit Message:
   fix(bugfix): update bugfix

? What would you like to do? ✎ Edit the message
? Enter your commit message: fix: resolve user authentication issue

✓ Committed: fix: resolve user authentication issue
```

### Example 3: Documentation only

```bash
# You modified: README.md, docs/guide.md
$ smartgit push

📝 Suggested Commit Message:
   docs: update documentation

? What would you like to do? ✓ Use this message and push
```

## 🔮 Roadmap (Phase 2)

- [ ] 🤖 AI-powered commit generation using OpenAI/Gemini API
- [ ] ⚙️ `.smartgitrc` configuration file support
- [ ] 🎫 JIRA/Linear ticket integration
- [ ] 📚 Commit history learning
- [ ] ✅ Pre-commit validation and linting
- [ ] 🔄 GitHub Actions integration
- [ ] 📊 Commit statistics and insights
- [ ] 🌐 Team-wide commit message templates

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [simple-git](https://github.com/steveukx/git-js) - Git integration
- [inquirer](https://github.com/SBoudrias/Inquirer.js) - Interactive CLI prompts
- [chalk](https://github.com/chalk/chalk) - Terminal styling
- [commander](https://github.com/tj/commander.js) - CLI framework
- [Conventional Commits](https://www.conventionalcommits.org/) - Commit message specification

## 💬 Support

If you have any questions or issues, please open an issue on GitHub.

---

Made with ❤️ by developers, for developers.

```bash
npm install -g smartgit-cli
smartgit push
```

**Happy Committing! 🎉**
