/**
 * Analyzer module for SmartGit
 * Analyzes ONLY changes since the last Git commit (HEAD-based analysis)
 */

import simpleGit from 'simple-git';
import parseDiff from 'parse-diff';
import { CONFIG } from './config.js';

/**
 * Analyzes changes since the last commit (HEAD-based)
 * @param {string} repoPath - Path to the Git repository
 * @param {Object} options - Analysis options
 * @param {string} options.mode - Analysis mode: 'all', 'staged', 'unstaged'
 * @returns {Promise<Object>} Analysis result with changes and metadata
 */
export async function analyzeChanges(repoPath = process.cwd(), options = {}) {
  const { mode = 'all' } = options;
  const git = simpleGit(repoPath);

  try {
    // Check if we're in a git repository
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      throw new Error('Not a git repository. Please run this command inside a git repository.');
    }

    // Check if HEAD exists (at least one commit)
    const hasHead = await checkHasHead(git);
    
    // Get status using porcelain format for reliable parsing
    const statusOutput = await git.raw(['status', '--porcelain']);
    const status = parsePorcelainStatus(statusOutput);

    // If no HEAD exists (first commit scenario), fallback to analyzing working tree
    if (!hasHead) {
      return await analyzeFirstCommit(git, status);
    }

    // Get appropriate diff based on mode
    let diffOutput = '';
    let analysisScope = '';
    
    switch (mode) {
      case 'staged':
        // Only staged changes
        diffOutput = await git.diff(['--cached', 'HEAD']);
        analysisScope = 'staged changes';
        break;
      case 'unstaged':
        // Only unstaged changes in working tree
        diffOutput = await git.diff(['HEAD']);
        analysisScope = 'unstaged changes';
        break;
      case 'all':
      default:
        // Both staged and unstaged changes since HEAD
        const stagedDiff = await git.diff(['--cached', 'HEAD']);
        const unstagedDiff = await git.diff(['HEAD']);
        diffOutput = stagedDiff + '\n' + unstagedDiff;
        analysisScope = 'all changes since last commit';
        break;
    }

    // Parse the diff to extract file changes and line statistics
    const parsedDiff = parseDiff(diffOutput);
    
    // Check if there are any changes
    if (parsedDiff.length === 0 && statusOutput.trim() === '') {
      return {
        hasChanges: false,
        message: 'No changes detected since the last commit',
        mode,
        analysisScope
      };
    }

    // Extract file information from parsed diff
    const fileChanges = extractFileChanges(parsedDiff, status);
    
    // Calculate line statistics
    const lineStats = calculateLineStats(parsedDiff);

    // Categorize files
    const categorization = categorizeFiles(fileChanges.allFiles);

    return {
      hasChanges: true,
      mode,
      analysisScope,
      changeTypes: fileChanges.changeTypes,
      files: fileChanges.allFiles,
      categorization,
      diff: diffOutput,
      lineStats,
      parsedDiff,
      summary: {
        totalFiles: fileChanges.allFiles.length,
        modified: fileChanges.changeTypes.modified.length,
        created: fileChanges.changeTypes.created.length,
        deleted: fileChanges.changeTypes.deleted.length,
        renamed: fileChanges.changeTypes.renamed.length,
        linesAdded: lineStats.additions,
        linesDeleted: lineStats.deletions,
        linesChanged: lineStats.total
      }
    };

  } catch (error) {
    throw new Error(`Failed to analyze git changes: ${error.message}`);
  }
}

/**
 * Checks if the repository has a HEAD (at least one commit)
 * @param {Object} git - simple-git instance
 * @returns {Promise<boolean>} True if HEAD exists
 */
async function checkHasHead(git) {
  try {
    await git.raw(['rev-parse', 'HEAD']);
    return true;
  } catch (error) {
    // No HEAD means no commits yet
    return false;
  }
}

/**
 * Parses git status --porcelain output
 * @param {string} statusOutput - Porcelain status output
 * @returns {Object} Parsed status object
 */
function parsePorcelainStatus(statusOutput) {
  const status = {
    modified: [],
    created: [],
    deleted: [],
    renamed: [],
    files: []
  };

  if (!statusOutput.trim()) {
    return status;
  }

  const lines = statusOutput.trim().split('\n');
  
  for (const line of lines) {
    if (line.length < 4) continue;
    
    const index = line[0];
    const workTree = line[1];
    const file = line.slice(3).trim();
    
    // Parse renamed files
    if (line.includes(' -> ')) {
      const [oldPath, newPath] = file.split(' -> ');
      status.renamed.push({ from: oldPath.trim(), to: newPath.trim() });
      status.files.push(newPath.trim());
      continue;
    }

    // Modified files (M in index or worktree)
    if (index === 'M' || workTree === 'M') {
      status.modified.push(file);
      status.files.push(file);
    }
    // Added/Created files (A or ??)
    else if (index === 'A' || (index === '?' && workTree === '?')) {
      status.created.push(file);
      status.files.push(file);
    }
    // Deleted files (D)
    else if (index === 'D' || workTree === 'D') {
      status.deleted.push(file);
      status.files.push(file);
    }
    // Renamed (R)
    else if (index === 'R') {
      // Already handled above
    }
    else {
      // Other changes (treated as modified)
      status.files.push(file);
    }
  }

  return status;
}

/**
 * Analyzes first commit scenario (no HEAD)
 * @param {Object} git - simple-git instance
 * @param {Object} status - Parsed status
 * @returns {Promise<Object>} Analysis result
 */
async function analyzeFirstCommit(git, status) {
  const allFiles = status.files;
  
  if (allFiles.length === 0) {
    return {
      hasChanges: false,
      message: 'No changes detected in the repository',
      isFirstCommit: true,
      analysisScope: 'first commit (no HEAD)'
    };
  }

  // For first commit, all files are "created"
  const categorization = categorizeFiles(allFiles);
  
  // Get diff for the working tree
  const diffOutput = await git.diff();
  const parsedDiff = parseDiff(diffOutput);
  const lineStats = calculateLineStats(parsedDiff);

  return {
    hasChanges: true,
    isFirstCommit: true,
    mode: 'all',
    analysisScope: 'first commit (no HEAD)',
    changeTypes: {
      modified: [],
      created: allFiles,
      deleted: [],
      renamed: []
    },
    files: allFiles,
    categorization,
    diff: diffOutput,
    lineStats,
    parsedDiff,
    summary: {
      totalFiles: allFiles.length,
      modified: 0,
      created: allFiles.length,
      deleted: 0,
      renamed: 0,
      linesAdded: lineStats.additions,
      linesDeleted: lineStats.deletions,
      linesChanged: lineStats.total
    }
  };
}

/**
 * Extracts file changes from parsed diff and status
 * @param {Array} parsedDiff - Parsed diff output
 * @param {Object} status - Parsed status
 * @returns {Object} File changes object
 */
function extractFileChanges(parsedDiff, status) {
  const changeTypes = {
    modified: [],
    created: [],
    deleted: [],
    renamed: []
  };

  const allFiles = new Set();

  // Extract from parsed diff
  for (const file of parsedDiff) {
    const filePath = file.to || file.from;
    
    if (file.deleted) {
      changeTypes.deleted.push(filePath);
    } else if (file.new) {
      changeTypes.created.push(filePath);
    } else if (file.renamed) {
      changeTypes.renamed.push({ from: file.from, to: file.to });
      allFiles.add(file.to);
      continue;
    } else {
      changeTypes.modified.push(filePath);
    }
    
    allFiles.add(filePath);
  }

  // Merge with status information
  for (const file of status.modified) {
    if (!allFiles.has(file)) {
      changeTypes.modified.push(file);
      allFiles.add(file);
    }
  }

  for (const file of status.created) {
    if (!allFiles.has(file)) {
      changeTypes.created.push(file);
      allFiles.add(file);
    }
  }

  for (const file of status.deleted) {
    if (!allFiles.has(file)) {
      changeTypes.deleted.push(file);
      allFiles.add(file);
    }
  }

  for (const rename of status.renamed) {
    const existing = changeTypes.renamed.find(r => r.to === rename.to);
    if (!existing) {
      changeTypes.renamed.push(rename);
      allFiles.add(rename.to);
    }
  }

  return {
    changeTypes,
    allFiles: Array.from(allFiles)
  };
}

/**
 * Calculates line statistics from parsed diff
 * @param {Array} parsedDiff - Parsed diff output
 * @returns {Object} Line statistics
 */
function calculateLineStats(parsedDiff) {
  let additions = 0;
  let deletions = 0;

  for (const file of parsedDiff) {
    if (file.chunks) {
      for (const chunk of file.chunks) {
        for (const change of chunk.changes) {
          if (change.type === 'add') {
            additions++;
          } else if (change.type === 'del') {
            deletions++;
          }
        }
      }
    }
    
    // Fallback to file-level stats
    if (file.additions !== undefined) {
      additions += file.additions;
    }
    if (file.deletions !== undefined) {
      deletions += file.deletions;
    }
  }

  return {
    additions,
    deletions,
    total: additions + deletions
  };
}

/**
 * Categorizes files based on their paths and extensions
 * @param {Array<string>} files - Array of file paths
 * @returns {Object} Categorization result
 */
function categorizeFiles(files) {
  const categories = {
    docs: [],
    test: [],
    config: [],
    style: [],
    source: []
  };

  for (const file of files) {
    const fileLower = file.toLowerCase();
    
    let categorized = false;

    // Check docs
    if (CONFIG.filePatterns.docs.some(pattern => fileLower.includes(pattern))) {
      categories.docs.push(file);
      categorized = true;
    }

    // Check test
    if (!categorized && CONFIG.filePatterns.test.some(pattern => fileLower.includes(pattern))) {
      categories.test.push(file);
      categorized = true;
    }

    // Check config
    if (!categorized && CONFIG.filePatterns.config.some(pattern => fileLower.includes(pattern))) {
      categories.config.push(file);
      categorized = true;
    }

    // Check style
    if (!categorized && CONFIG.filePatterns.style.some(pattern => fileLower.includes(pattern))) {
      categories.style.push(file);
      categorized = true;
    }

    // Default to source
    if (!categorized) {
      categories.source.push(file);
    }
  }

  return categories;
}

/**
 * Determines the primary change type from categorized files
 * @param {Object} categorization - File categorization
 * @param {Object} changeTypes - Types of changes (modified, created, etc.)
 * @returns {string} Primary change type
 */
export function determinePrimaryType(categorization, changeTypes) {
  // Priority order for determining commit type
  
  // If only docs changed
  if (categorization.docs.length > 0 && 
      categorization.source.length === 0 && 
      categorization.test.length === 0) {
    return 'docs';
  }

  // If only tests changed
  if (categorization.test.length > 0 && 
      categorization.source.length === 0) {
    return 'test';
  }

  // If only config/build files changed
  if (categorization.config.length > 0 && 
      categorization.source.length === 0 && 
      categorization.test.length === 0 &&
      categorization.docs.length === 0) {
    return 'chore';
  }

  // If only style files changed
  if (categorization.style.length > 0 && 
      categorization.source.length === 0) {
    return 'style';
  }

  // If new files were created
  if (changeTypes.created && changeTypes.created.length > 0 && 
      changeTypes.modified.length === 0) {
    return 'feat';
  }

  // Check file names and paths for keywords
  const allFiles = [
    ...categorization.source,
    ...categorization.test
  ].join(' ').toLowerCase();

  // Check for fix keywords
  if (allFiles.includes('fix') || allFiles.includes('bug') || allFiles.includes('patch')) {
    return 'fix';
  }

  // Check for refactor keywords
  if (allFiles.includes('refactor')) {
    return 'refactor';
  }

  // Default: if there are source changes
  if (categorization.source.length > 0) {
    // If mostly new files, it's a feature
    if (changeTypes.created && changeTypes.created.length > changeTypes.modified.length) {
      return 'feat';
    }
    // Otherwise, default to fix or feat based on context
    return 'feat';
  }

  return 'chore';
}

/**
 * Gets a summary of changes for display
 * @param {Object} analysis - Analysis result from analyzeChanges
 * @returns {string} Human-readable summary
 */
export function getChangeSummary(analysis) {
  if (!analysis.hasChanges) {
    return analysis.message;
  }

  const parts = [];
  const { summary } = analysis;

  if (summary.created > 0) {
    parts.push(`${summary.created} created`);
  }
  if (summary.modified > 0) {
    parts.push(`${summary.modified} modified`);
  }
  if (summary.deleted > 0) {
    parts.push(`${summary.deleted} deleted`);
  }
  if (summary.renamed > 0) {
    parts.push(`${summary.renamed} renamed`);
  }

  let result = `${summary.totalFiles} file(s) changed: ${parts.join(', ')}`;
  
  // Add line statistics if available
  if (summary.linesAdded !== undefined || summary.linesDeleted !== undefined) {
    const linesParts = [];
    if (summary.linesAdded > 0) {
      linesParts.push(`+${summary.linesAdded}`);
    }
    if (summary.linesDeleted > 0) {
      linesParts.push(`-${summary.linesDeleted}`);
    }
    if (linesParts.length > 0) {
      result += ` (${linesParts.join(', ')})`;
    }
  }

  return result;
}
