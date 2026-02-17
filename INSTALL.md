# SmartGit Installation Guide

This guide will help you install and set up SmartGit on your system.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [Global Installation](#global-installation)
- [Local Installation](#local-installation)
- [Installation from Source](#installation-from-source)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Uninstallation](#uninstallation)

## Prerequisites

Before installing SmartGit, ensure you have:

- **Node.js** version 18.0.0 or higher
- **npm** (comes with Node.js)
- **Git** installed and configured
- A terminal/command prompt

### Check Prerequisites

```bash
# Check Node.js version
node --version
# Should output v18.0.0 or higher

# Check npm version
npm --version

# Check Git version
git --version
```

### Installing Prerequisites

#### macOS

```bash
# Install Node.js using Homebrew
brew install node

# Install Git using Homebrew
brew install git
```

#### Linux (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install git
```

#### Windows

1. Download and install Node.js from [nodejs.org](https://nodejs.org/)
2. Download and install Git from [git-scm.com](https://git-scm.com/)

## Installation Methods

### Method 1: Global Installation (Recommended)

Install SmartGit globally to use it anywhere on your system.

```bash
# Future: When published to npm
npm install -g smartgit-cli

# Verify installation
smartgit --version
```

### Method 2: Local Installation

Install SmartGit in a specific project.

```bash
# Navigate to your project
cd /path/to/your/project

# Install SmartGit
npm install smartgit-cli

# Use with npx
npx smartgit push
```

### Method 3: Installation from Source

Install SmartGit directly from the source code (for development or testing).

```bash
# Clone the repository
git clone https://github.com/yourusername/smartgit.git

# Navigate to the directory
cd smartgit

# Install dependencies
npm install

# Link globally (makes 'smartgit' command available everywhere)
npm link

# Verify installation
smartgit --version
```

## Verification

After installation, verify SmartGit is working:

```bash
# Check version
smartgit --version
# Should output: 1.0.0

# Check help
smartgit --help
# Should show available commands

# Test in a Git repository
cd /path/to/any/git/repo
smartgit info
```

## Quick Start

Once installed, navigate to any Git repository and run:

```bash
# Make some changes to your repository
echo "test" > test.txt

# Run SmartGit
smartgit push
```

## Configuration

SmartGit works out of the box with no configuration required!

### Optional: Set up Git

If you haven't configured Git yet:

```bash
# Set your name
git config --global user.name "Your Name"

# Set your email
git config --global user.email "your.email@example.com"

# Verify configuration
git config --list
```

## Troubleshooting

### Issue: Command not found

**Problem:** `smartgit: command not found`

**Solution:**

```bash
# If installed globally
npm install -g smartgit-cli

# If installed from source, link it
cd /path/to/smartgit
npm link

# Check npm global bin directory
npm config get prefix
# Make sure this directory is in your PATH
```

### Issue: Permission denied

**Problem:** `EACCES: permission denied`

**Solution:**

```bash
# On macOS/Linux, use sudo (not recommended)
sudo npm install -g smartgit-cli

# Better: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile

# Now install without sudo
npm install -g smartgit-cli
```

### Issue: Node version too old

**Problem:** `This package requires Node.js >= 18.0.0`

**Solution:**

```bash
# Update Node.js
# macOS (using Homebrew)
brew upgrade node

# Linux (using nvm)
nvm install 18
nvm use 18

# Windows: Download latest from nodejs.org
```

### Issue: Git not installed

**Problem:** `git: command not found`

**Solution:**

```bash
# macOS
brew install git

# Linux (Ubuntu/Debian)
sudo apt-get install git

# Windows: Download from git-scm.com
```

### Issue: Module not found errors

**Problem:** `Cannot find module 'simple-git'`

**Solution:**

```bash
# Navigate to SmartGit directory
cd /path/to/smartgit

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: Permission issues with npm link

**Problem:** `EACCES` errors when running `npm link`

**Solution:**

```bash
# Use sudo (temporary fix)
sudo npm link

# Better: Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

## Updating SmartGit

### From npm (future)

```bash
# Update to latest version
npm update -g smartgit-cli

# Or reinstall
npm uninstall -g smartgit-cli
npm install -g smartgit-cli
```

### From source

```bash
# Navigate to SmartGit directory
cd /path/to/smartgit

# Pull latest changes
git pull origin main

# Reinstall dependencies
npm install

# Relink (if needed)
npm link
```

## Uninstallation

### Global installation

```bash
# Uninstall from npm
npm uninstall -g smartgit-cli

# Verify removal
smartgit --version
# Should output: command not found
```

### From source

```bash
# Unlink the package
npm unlink -g smartgit-cli

# Or use uninstall
cd /path/to/smartgit
npm unlink

# Remove the directory
cd ..
rm -rf smartgit
```

## Platform-Specific Notes

### macOS

- Works seamlessly on all macOS versions with Node.js 18+
- Recommended installation via Homebrew for prerequisites
- Uses native terminal colors and emojis

### Linux

- Tested on Ubuntu, Debian, Fedora, Arch
- Ensure terminal supports colors (most modern terminals do)
- May need to adjust permissions for npm global packages

### Windows

- Works with Command Prompt, PowerShell, and Git Bash
- Git Bash recommended for best experience
- Windows Terminal (Windows 11) provides excellent color support
- Note: Emoji support may vary based on terminal

## Post-Installation

After installation, you can:

1. **Read the documentation**: `cat README.md`
2. **Check examples**: `cat EXAMPLES.md`
3. **Run in a test repo**: Create a test repository and try it out
4. **Configure Git**: Make sure Git is properly configured

## Getting Help

If you encounter any issues:

1. Check this installation guide
2. Review [EXAMPLES.md](EXAMPLES.md)
3. Read [README.md](README.md)
4. Open an issue on GitHub
5. Check existing issues for solutions

## Next Steps

Now that SmartGit is installed:

1. Navigate to a Git repository
2. Make some changes
3. Run `smartgit push`
4. Enjoy automated Git workflows!

## Tips

- **Use in projects**: Navigate to any Git repository and use SmartGit
- **Test first**: Try `smartgit info` before pushing
- **Edit messages**: Always review and edit suggested commit messages
- **Stay updated**: Check for updates regularly

---

**Happy committing with SmartGit! 🚀**

For more information, see:
- [README.md](README.md) - Main documentation
- [EXAMPLES.md](EXAMPLES.md) - Usage examples
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contributing guide
