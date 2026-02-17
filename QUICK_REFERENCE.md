# SmartGit v2.0 - Quick Reference

## 🚀 What's New in v2.0

**HEAD-Based Analysis**: Analyzes ONLY changes since the last commit, never historical code.

## 📝 Commands

### Basic Usage
```bash
smartgit push              # Analyze all changes and push
smartgit info              # Show repository info
smartgit --version         # Show version (2.0.0)
smartgit --help            # Show help
```

### Analysis Modes (New in v2.0)
```bash
smartgit push --all        # All changes (staged + unstaged) - DEFAULT
smartgit push --staged     # Only staged changes
smartgit push --unstaged   # Only unstaged changes
```

## 🎯 Use Cases

### Incremental Commits
```bash
# Stage and commit specific files
git add feature.js
smartgit push --staged
```

### Review Before Commit
```bash
# Check what would be committed
smartgit push --unstaged   # See unstaged changes
git add -A                 # Stage everything
smartgit push              # Commit and push
```

### First Commit
```bash
# Automatically detects first commit
git init
touch README.md
smartgit push              # Will show "This will be your first commit"
```

## 📊 Output Format

```
🚀 SmartGit - Intelligent Git Automation

Checking for conflicts...
Analyzing all changes since last commit...

Analysis scope: all changes since last commit

📊 Changes Summary:
   3 file(s) changed: 2 modified, 1 created (+42, -15)
                                            ↑       ↑
                                         lines   lines
                                         added   deleted

   Modified:
     ~ src/app.js
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
```

## 🔍 Key Features

### Line Statistics (New)
Shows precise change metrics:
- `+42` = 42 lines added
- `-15` = 15 lines deleted
- Displayed in summary: `(+42, -15)`

### Analysis Scope (New)
Indicates what's being analyzed:
- `all changes since last commit`
- `staged changes`
- `unstaged changes`
- `first commit (no HEAD)`

### Conventional Commits
Generates messages in standard format:
```
<type>(<scope>): <description>

Examples:
feat(auth): add user login
fix(api): resolve timeout issue
docs: update README
refactor(utils): improve error handling
test: add unit tests
chore(deps): update dependencies
```

## ⚡ Workflow Examples

### Example 1: Quick Commit
```bash
# Make changes
vim src/app.js

# Run SmartGit
smartgit push

# Answer prompts, done!
```

### Example 2: Staged Only
```bash
# Stage specific files
git add feature1.js feature2.js

# Commit only staged
smartgit push --staged

# Continue working on unstaged files
```

### Example 3: Review First
```bash
# Check unstaged changes
smartgit push --unstaged

# If looks good, stage and commit
git add -A
smartgit push
```

## 🛠️ Technical Details

### Git Commands Used
```bash
git rev-parse HEAD              # Check HEAD exists
git status --porcelain          # Get file status
git diff HEAD                   # Get unstaged changes
git diff --cached HEAD          # Get staged changes
```

### Analysis Flow
```
1. Validate HEAD exists
2. Get status with --porcelain
3. Execute git diff HEAD (with mode)
4. Parse diff output
5. Calculate line statistics
6. Categorize files
7. Generate commit message
```

## 📚 Documentation

- **README.md** - Main documentation
- **HEAD_BASED_ANALYSIS.md** - Technical deep dive
- **CHANGELOG.md** - Version history
- **EXAMPLES.md** - Usage examples
- **V2_IMPLEMENTATION_COMPLETE.md** - Implementation details

## 🎓 Tips

1. **Use --staged for incremental work**
   ```bash
   git add file1.js
   smartgit push --staged
   # Continue editing other files
   ```

2. **Review before committing everything**
   ```bash
   smartgit push --unstaged  # Preview
   git add -A                # Stage
   smartgit push --all       # Commit
   ```

3. **Edit messages when needed**
   - Always review the suggested message
   - Use ✎ Edit option for custom messages
   - Follow Conventional Commits format

4. **Let SmartGit handle first commits**
   ```bash
   git init
   # Add files...
   smartgit push  # Automatically detects first commit
   ```

## 🚨 Troubleshooting

### "No changes detected"
**Cause**: Working tree matches HEAD  
**Fix**: Make changes or check git status

### Analysis shows fewer files
**Cause**: Wrong mode selected  
**Fix**: Use --all or stage files with git add

### Line stats incorrect
**Cause**: Binary files or whitespace  
**Fix**: Check git diff output

## 📌 Remember

✅ Analyzes ONLY changes since HEAD  
✅ Never uses historical commit data  
✅ Deterministic and reproducible  
✅ Production-ready quality  
✅ Backward compatible with v1.0  

## 🎉 Quick Start

```bash
# Install
npm install -g smartgit-cli

# Or link locally
cd SmartGit
npm link

# Use it
cd your-project
smartgit push

# That's it! 🚀
```

---

**Version**: 2.0.0  
**Released**: February 17, 2026  
**Status**: Production Ready ✅

For detailed documentation, see [HEAD_BASED_ANALYSIS.md](HEAD_BASED_ANALYSIS.md)
