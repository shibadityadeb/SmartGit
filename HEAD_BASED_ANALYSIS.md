# HEAD-Based Analysis in SmartGit v2.0

## Overview

SmartGit v2.0 introduces **HEAD-based analysis**, a fundamental change that ensures commit messages describe only the changes made since the last commit (`HEAD`), not historical changes.

## Why HEAD-Based Analysis?

### The Problem
In v1.0, SmartGit analyzed the entire working directory state, which could include:
- Old commits that were already described
- Historical file states
- Irrelevant content outside the scope of the current commit

### The Solution
v2.0 compares your working tree against `HEAD`:
```bash
git diff HEAD          # Compare working tree to last commit
git diff --cached HEAD # Compare staging area to last commit
```

This ensures commit messages **only describe what changed since the last commit**.

---

## Architecture

### Core Components

#### 1. `checkHasHead(git)`
Validates that HEAD exists in the repository:
```javascript
async function checkHasHead(git) {
  try {
    await git.raw(['rev-parse', 'HEAD']);
    return true;
  } catch (error) {
    return false;
  }
}
```

**Use Cases:**
- Detects first commit scenario (no HEAD yet)
- Handles empty repositories
- Prevents git command errors

#### 2. `analyzeFirstCommit(git, status)`
Handles the special case when there's no HEAD:
```javascript
async function analyzeFirstCommit(git, status) {
  const stagedFiles = status.files.filter(f => 
    f.index !== ' ' && f.index !== '?'
  );
  
  const analysis = {
    files: {},
    summary: {
      totalFiles: stagedFiles.length,
      additions: 0,
      deletions: 0,
      isFirstCommit: true
    }
  };
  // ... process each staged file
}
```

**Key Features:**
- Analyzes all staged files as new additions
- No diff comparison (nothing to compare against)
- Sets `isFirstCommit: true` flag

#### 3. `analyzeChanges(repoPath, options)`
Main analysis function with three modes:

```javascript
export async function analyzeChanges(repoPath, options = {}) {
  const { mode = 'all' } = options;
  
  const hasHead = await checkHasHead(git);
  if (!hasHead) {
    return await analyzeFirstCommit(git, status);
  }
  
  // Get diff based on mode
  let diffCommand;
  switch (mode) {
    case 'staged':
      diffCommand = ['diff', '--cached', 'HEAD', '--unified=0'];
      break;
    case 'unstaged':
      diffCommand = ['diff', 'HEAD', '--unified=0'];
      break;
    case 'all':
    default:
      diffCommand = ['diff', 'HEAD', '--unified=0'];
  }
  
  const diffOutput = await git.raw(diffCommand);
  const parsedDiff = parseDiff(diffOutput);
  
  // ... process diff
}
```

#### 4. `extractFileChanges(parsedDiff, status)`
Merges diff data with status information:
```javascript
function extractFileChanges(parsedDiff, status) {
  const fileChanges = {};
  
  for (const file of parsedDiff) {
    const filepath = file.to || file.from;
    
    fileChanges[filepath] = {
      path: filepath,
      status: determineStatus(file, status),
      chunks: file.chunks,
      additions: file.additions,
      deletions: file.deletions
    };
  }
  
  return fileChanges;
}
```

#### 5. `calculateLineStats(parsedDiff)`
Counts additions and deletions from diff:
```javascript
function calculateLineStats(parsedDiff) {
  let totalAdditions = 0;
  let totalDeletions = 0;
  
  for (const file of parsedDiff) {
    totalAdditions += file.additions;
    totalDeletions += file.deletions;
  }
  
  return { totalAdditions, totalDeletions };
}
```

---

## Analysis Modes

### 1. All Changes (Default)
**Command:** `smartgit push` or `smartgit push --all`

**Git Command:** `git diff HEAD --unified=0`

**What it analyzes:**
- All changes in working tree vs HEAD
- Both staged and unstaged changes
- Shows complete picture of what's different

**Use Case:** Typical workflow when you want to analyze everything before committing

**Example Output:**
```
📊 Analysis Scope: All changes (staged + unstaged)
✓ Analyzed 3 files with 42 additions and 8 deletions
```

### 2. Staged Changes Only
**Command:** `smartgit push --staged`

**Git Command:** `git diff --cached HEAD --unified=0`

**What it analyzes:**
- Only changes in the staging area (index)
- Changes you've already `git add`-ed
- Excludes unstaged modifications

**Use Case:** 
- You've staged some changes and want to understand what will be committed
- Working on multiple features and only committing one

**Example Output:**
```
📊 Analysis Scope: Staged changes only
✓ Analyzed 2 files with 25 additions and 3 deletions
```

### 3. Unstaged Changes Only
**Command:** `smartgit push --unstaged`

**Git Command:** `git diff HEAD --unified=0`

**What it analyzes:**
- Changes in working directory not yet staged
- Modifications since last `git add`
- Useful for reviewing before staging

**Use Case:**
- You want to review working changes before staging
- Checking what's left to stage

**Example Output:**
```
📊 Analysis Scope: Unstaged changes only
✓ Analyzed 1 file with 17 additions and 5 deletions
```

---

## Edge Cases Handled

### 1. First Commit (No HEAD)
**Scenario:** Repository has no commits yet

**Detection:**
```bash
git rev-parse HEAD  # Returns error if no HEAD
```

**Behavior:**
- Analyzes all staged files as new additions
- No diff comparison possible
- Sets `isFirstCommit: true` in analysis result
- Message: "⚠️ This appears to be your first commit. All staged files will be analyzed as new additions."

**Example:**
```bash
# New repository
git init
git add .
smartgit push
# Output: "⚠️ This appears to be your first commit..."
```

### 2. No Changes
**Scenario:** Working tree matches HEAD exactly

**Detection:**
```javascript
if (!diffOutput || diffOutput.trim() === '') {
  return {
    files: {},
    summary: {
      totalFiles: 0,
      additions: 0,
      deletions: 0
    }
  };
}
```

**Behavior:**
- Returns empty analysis
- CLI shows: "❌ No changes detected to analyze"
- Does not proceed with commit

### 3. Only Unstaged Changes with --staged
**Scenario:** `--staged` flag used but nothing is staged

**Behavior:**
- `git diff --cached HEAD` returns empty
- Shows: "❌ No staged changes found to analyze"
- Suggests: "Run 'git add' first or use '--all' flag"

### 4. Deleted Files
**Scenario:** File deleted from working tree

**Detection:**
```javascript
function determineStatus(fileDiff, gitStatus) {
  if (fileDiff.deleted) return 'deleted';
  if (fileDiff.new) return 'new';
  return 'modified';
}
```

**Behavior:**
- Tracks deletion properly
- Shows in commit message
- Counts deletions in line stats

### 5. Renamed Files
**Scenario:** File moved or renamed

**Git Diff Output:**
```diff
rename from old-name.js
rename to new-name.js
```

**Detection:**
```javascript
if (file.from !== file.to) {
  status = 'renamed';
}
```

**Behavior:**
- Detects rename operation
- Shows both old and new paths
- Tracks content changes if any

---

## Technical Implementation Details

### Diff Format Parsing

SmartGit uses the `parse-diff` library to parse unified diff format:

```javascript
import parseDiff from 'parse-diff';

const diffOutput = await git.raw(['diff', 'HEAD', '--unified=0']);
const parsedDiff = parseDiff(diffOutput);
```

**Parsed Diff Structure:**
```javascript
[
  {
    to: 'lib/analyzer.js',
    from: 'lib/analyzer.js',
    chunks: [
      {
        oldStart: 10,
        oldLines: 5,
        newStart: 10,
        newLines: 8,
        changes: [
          { type: 'del', content: '-  const oldCode = true;' },
          { type: 'add', content: '+  const newCode = true;' },
          { type: 'add', content: '+  const moreCode = true;' }
        ]
      }
    ],
    additions: 2,
    deletions: 1,
    new: false,
    deleted: false
  }
]
```

### Status Information Enrichment

SmartGit combines diff data with `git status --porcelain`:

```javascript
const statusOutput = await git.raw(['status', '--porcelain']);
const status = parsePorcelainStatus(statusOutput);
```

**Porcelain Status Format:**
```
 M lib/analyzer.js   # Modified, unstaged
M  bin/smartgit.js   # Modified, staged
A  lib/new.js        # Added, staged
D  lib/old.js        # Deleted, staged
?? temp.txt          # Untracked
```

**Parsing:**
```javascript
function parsePorcelainStatus(output) {
  const lines = output.trim().split('\n').filter(line => line);
  const files = lines.map(line => {
    const index = line[0];
    const workingTree = line[1];
    const path = line.substring(3);
    
    return { index, workingTree, path };
  });
  
  return { files };
}
```

### Line Statistics Calculation

```javascript
function calculateLineStats(parsedDiff) {
  let totalAdditions = 0;
  let totalDeletions = 0;
  
  for (const file of parsedDiff) {
    totalAdditions += file.additions;
    totalDeletions += file.deletions;
  }
  
  return { totalAdditions, totalDeletions };
}
```

**Display:**
```bash
✓ Analyzed 3 files with 42 additions and 8 deletions
```

---

## Usage Examples

### Example 1: Feature Development
```bash
# Make changes to multiple files
vim lib/analyzer.js
vim bin/smartgit.js

# Stage some changes
git add lib/analyzer.js

# Analyze only staged changes
smartgit push --staged
# Shows: "✓ Analyzed 1 file with 25 additions and 3 deletions"

# Analyze all changes (staged + unstaged)
smartgit push --all
# Shows: "✓ Analyzed 2 files with 42 additions and 8 deletions"
```

### Example 2: First Commit
```bash
# New project
git init
npm init -y
echo "console.log('hello');" > index.js

# Stage files
git add .

# First commit analysis
smartgit push
# Shows: "⚠️ This appears to be your first commit..."
# Analyzes all staged files as new additions
```

### Example 3: Reviewing Before Staging
```bash
# Make changes but don't stage
vim README.md
vim lib/utils.js

# Review unstaged changes
smartgit push --unstaged
# Shows what you're about to stage

# Stage if satisfied
git add -A
smartgit push --staged
# Confirm staged changes before commit
```

### Example 4: Bug Fix Workflow
```bash
# Fix bug in single file
vim lib/buggy-module.js

# Analyze just this change
smartgit push --all
# Shows: "✓ Analyzed 1 file with 3 additions and 3 deletions"

# Get suggested commit message
# Commit and push with generated message
```

---

## Migration from v1.0

### What Changed

**v1.0 Behavior:**
```javascript
// Analyzed entire file state
const files = await git.status();
// Looked at all file contents regardless of commit history
```

**v2.0 Behavior:**
```javascript
// Compares against HEAD
const diff = await git.raw(['diff', 'HEAD', '--unified=0']);
// Only analyzes what changed since last commit
```

### Breaking Changes

1. **Analysis Results Changed:**
   - v1.0: Included all files in working tree
   - v2.0: Only files with changes vs HEAD

2. **Line Statistics Added:**
   - v1.0: No line-level stats
   - v2.0: `additions` and `deletions` in summary

3. **First Commit Handling:**
   - v1.0: Treated like any other commit
   - v2.0: Special handling with warning message

### Migration Guide

**If you're using SmartGit as a library:**

```javascript
// v1.0
import { analyzeChanges } from 'smartgit/lib/analyzer.js';
const analysis = await analyzeChanges('/path/to/repo');
// analysis.files contained all changed files

// v2.0
import { analyzeChanges } from 'smartgit/lib/analyzer.js';
const analysis = await analyzeChanges('/path/to/repo', { mode: 'all' });
// New fields in analysis:
// - analysis.summary.additions
// - analysis.summary.deletions
// - analysis.summary.isFirstCommit (if applicable)
```

**If you're using the CLI:**

```bash
# v1.0 - No mode flags
smartgit push

# v2.0 - Mode flags available
smartgit push --all      # Default, same as v1.0 behavior
smartgit push --staged   # New: analyze only staged changes
smartgit push --unstaged # New: analyze only unstaged changes
```

---

## Troubleshooting

### Issue: "No changes detected to analyze"

**Cause:** Working tree matches HEAD

**Solutions:**
1. Make changes to files
2. Check if changes are staged: `git status`
3. If using `--staged`, ensure changes are staged: `git add .`

### Issue: "This appears to be your first commit"

**Cause:** Repository has no HEAD (no commits yet)

**Expected:** This is normal for first commit

**Action:** Proceed with commit - all staged files will be analyzed

### Issue: "--staged shows no changes but I added files"

**Cause:** Files staged but `--staged` flag expects changes vs HEAD

**Solution:**
- Use `--all` instead if you want to see all changes
- Or ensure files are actually staged: `git add <files>`

### Issue: "Line statistics seem wrong"

**Cause:** Git's diff algorithm may count differently than expected

**Explanation:**
- Line stats come from `git diff`, not manual counting
- Git may treat whitespace/formatting changes differently
- Use `git diff HEAD` to verify line counts manually

---

## Performance Considerations

### Diff Size
- `--unified=0` flag reduces diff context
- Only line changes are parsed, no surrounding context
- Large diffs (>10,000 lines) may take longer

### First Commit
- Analyzes all staged files
- May be slower for large initial commits
- Consider breaking initial commit into chunks

### File Reading
- Only changed sections are analyzed
- Unchanged files are skipped
- Efficient for large repositories

---

## Security Notes

1. **No Credentials in Diff:**
   - SmartGit never stores diff content
   - All analysis happens in memory
   - Sensitive data in diffs is not persisted

2. **Git Operations:**
   - Read-only git commands used for analysis
   - No automatic commits without user confirmation
   - Push operations require explicit approval

3. **File System:**
   - Only reads files within git repository
   - No access outside repository boundaries
   - Respects `.gitignore` through git commands

---

## Future Enhancements

### Planned Features
- `--since=<commit>`: Analyze changes since specific commit
- `--branch-diff`: Compare current branch to base branch
- `--file=<pattern>`: Analyze only specific files
- Diff caching for faster repeated analysis
- Support for submodules

### Potential Improvements
- Configurable context lines
- Custom diff algorithms
- Integration with git hooks
- Real-time analysis during development

---

## Conclusion

HEAD-based analysis in SmartGit v2.0 ensures that your commit messages accurately describe **what changed since the last commit**, not the entire state of your project. This fundamental architecture change makes SmartGit more reliable and accurate for generating meaningful commit messages.

For questions or issues, see:
- [README.md](README.md) - General documentation
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick start guide
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [GitHub Issues](https://github.com/yourusername/smartgit/issues) - Report bugs
