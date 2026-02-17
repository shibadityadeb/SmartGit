/**
 * Suggester module for SmartGit
 * Generates intelligent commit messages based on analysis
 */

import { determinePrimaryType } from './analyzer.js';
import { CONFIG } from './config.js';

/**
 * Generates a commit message suggestion based on analysis
 * @param {Object} analysis - Result from analyzeChanges
 * @returns {string} Suggested commit message in Conventional Commits format
 */
export function generateCommitMessage(analysis) {
  if (!analysis.hasChanges) {
    return null;
  }

  const { categorization, changeTypes, files } = analysis;

  // Determine the commit type
  const commitType = determinePrimaryType(categorization, changeTypes);

  // Generate the scope (optional but useful)
  const scope = determineScope(files, categorization);

  // Generate the description
  const description = generateDescription(categorization, changeTypes, files);

  // Construct the commit message
  let message = commitType;
  if (scope) {
    message += `(${scope})`;
  }
  message += `: ${description}`;

  return message;
}

/**
 * Determines the scope of changes
 * @param {Array<string>} files - Changed files
 * @param {Object} categorization - File categorization
 * @returns {string|null} Scope or null
 */
function determineScope(files, categorization) {
  // If only one file changed, use its name (without extension)
  if (files.length === 1) {
    const fileName = files[0].split('/').pop();
    const nameWithoutExt = fileName.split('.')[0];
    return nameWithoutExt.toLowerCase();
  }

  // Try to find common directory
  const commonPath = findCommonPath(files);
  if (commonPath && commonPath !== '.') {
    // Get the most specific directory name
    const parts = commonPath.split('/').filter(p => p);
    if (parts.length > 0) {
      // Return the last directory name
      return parts[parts.length - 1];
    }
  }

  // Based on categorization
  if (categorization.docs.length === files.length) {
    return 'docs';
  }
  if (categorization.test.length === files.length) {
    return 'tests';
  }
  if (categorization.config.length === files.length) {
    return 'config';
  }

  // No clear scope
  return null;
}

/**
 * Finds common path among files
 * @param {Array<string>} files - List of file paths
 * @returns {string|null} Common path or null
 */
function findCommonPath(files) {
  if (files.length === 0) return null;
  if (files.length === 1) {
    const parts = files[0].split('/');
    parts.pop(); // Remove filename
    return parts.join('/') || '.';
  }

  const paths = files.map(f => f.split('/'));
  const firstPath = paths[0];
  
  let commonParts = [];
  
  for (let i = 0; i < firstPath.length - 1; i++) {
    const part = firstPath[i];
    if (paths.every(p => p[i] === part)) {
      commonParts.push(part);
    } else {
      break;
    }
  }

  return commonParts.length > 0 ? commonParts.join('/') : null;
}

/**
 * Generates a description for the commit
 * @param {Object} categorization - File categorization
 * @param {Object} changeTypes - Types of changes
 * @param {Array<string>} files - Changed files
 * @returns {string} Commit description
 */
function generateDescription(categorization, changeTypes, files) {
  const parts = [];

  // Special case for single file
  if (files.length === 1) {
    const file = files[0];
    const fileName = file.split('/').pop();
    
    if (changeTypes.created && changeTypes.created.includes(file)) {
      return `add ${fileName}`;
    }
    if (changeTypes.deleted && changeTypes.deleted.includes(file)) {
      return `remove ${fileName}`;
    }
    if (changeTypes.modified && changeTypes.modified.includes(file)) {
      return `update ${fileName}`;
    }
  }

  // Multiple files - be more general
  if (categorization.docs.length > 0 && categorization.source.length === 0 && categorization.test.length === 0) {
    return 'update documentation';
  }

  if (categorization.test.length > 0 && categorization.source.length === 0) {
    if (changeTypes.created && changeTypes.created.length > 0) {
      return 'add tests';
    }
    return 'update tests';
  }

  if (categorization.config.length > 0 && categorization.source.length === 0 && categorization.test.length === 0) {
    return 'update configuration';
  }

  if (categorization.style.length > 0 && categorization.source.length === 0) {
    return 'update styles';
  }

  // Source code changes
  if (categorization.source.length > 0) {
    // Check if mostly creating new files
    if (changeTypes.created && changeTypes.created.length > changeTypes.modified.length) {
      const mainFeature = inferFeatureFromFiles(changeTypes.created);
      if (mainFeature) {
        return `add ${mainFeature}`;
      }
      return 'add new features';
    }

    // Check if mostly modifying
    if (changeTypes.modified && changeTypes.modified.length > 0) {
      const mainFeature = inferFeatureFromFiles(changeTypes.modified);
      if (mainFeature) {
        return `update ${mainFeature}`;
      }
      return 'update implementation';
    }

    // Check if mostly deleting
    if (changeTypes.deleted && changeTypes.deleted.length > 0) {
      return 'remove deprecated code';
    }
  }

  // Mixed changes
  const changeCount = files.length;
  if (changeCount <= 3) {
    return 'update project files';
  }

  return 'update multiple components';
}

/**
 * Infers feature name from file paths
 * @param {Array<string>} files - List of files
 * @returns {string|null} Feature name or null
 */
function inferFeatureFromFiles(files) {
  if (files.length === 0) return null;

  // Get file names without extensions
  const fileNames = files.map(f => {
    const name = f.split('/').pop();
    return name.split('.')[0];
  });

  // Find common words
  const words = fileNames.flatMap(name => 
    name
      .replace(/([A-Z])/g, ' $1')
      .split(/[-_\s]+/)
      .filter(w => w.length > 2)
      .map(w => w.toLowerCase())
  );

  // Count word frequency
  const wordCount = {};
  for (const word of words) {
    wordCount[word] = (wordCount[word] || 0) + 1;
  }

  // Get most common word
  let maxCount = 0;
  let commonWord = null;
  for (const [word, count] of Object.entries(wordCount)) {
    if (count > maxCount && count > 1) {
      maxCount = count;
      commonWord = word;
    }
  }

  return commonWord;
}

/**
 * Generates multiple commit message alternatives
 * @param {Object} analysis - Result from analyzeChanges
 * @returns {Array<string>} Array of suggested commit messages
 */
export function generateAlternatives(analysis) {
  const messages = [];
  const primary = generateCommitMessage(analysis);
  
  if (primary) {
    messages.push(primary);

    // Generate variations
    const { categorization, changeTypes, files } = analysis;
    const commitType = determinePrimaryType(categorization, changeTypes);

    // Alternative without scope
    const desc = generateDescription(categorization, changeTypes, files);
    messages.push(`${commitType}: ${desc}`);

    // More generic alternative
    if (files.length > 1) {
      messages.push(`${commitType}: update ${files.length} files`);
    }
  }

  // Remove duplicates
  return [...new Set(messages)];
}
