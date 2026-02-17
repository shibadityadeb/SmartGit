/**
 * Configuration module for SmartGit
 * Handles configuration settings and constants
 */

export const CONFIG = {
  // Commit type categories and their patterns
  commitTypes: {
    feat: {
      keywords: ['add', 'create', 'new', 'implement', 'feature'],
      description: 'A new feature'
    },
    fix: {
      keywords: ['fix', 'bug', 'issue', 'resolve', 'patch', 'correct'],
      description: 'A bug fix'
    },
    refactor: {
      keywords: ['refactor', 'restructure', 'rewrite', 'improve', 'optimize', 'clean'],
      description: 'Code refactoring'
    },
    docs: {
      keywords: ['doc', 'readme', 'comment', 'documentation'],
      description: 'Documentation changes'
    },
    test: {
      keywords: ['test', 'spec', 'jest', 'mocha', 'cypress'],
      description: 'Test files'
    },
    style: {
      keywords: ['style', 'format', 'prettier', 'eslint', 'lint'],
      description: 'Code style changes'
    },
    chore: {
      keywords: ['chore', 'config', 'package', 'dependency', 'build', 'ci'],
      description: 'Build process or auxiliary tool changes'
    }
  },

  // File patterns for categorization
  filePatterns: {
    docs: ['.md', '.txt', 'readme', 'license', 'changelog'],
    test: ['.test.', '.spec.', '__tests__', 'test/', 'tests/'],
    config: ['.json', '.yml', '.yaml', '.toml', '.config.', 'config/', '.env'],
    style: ['.css', '.scss', '.sass', '.less', '.style.']
  },

  // Maximum number of files to show in detail
  maxFilesToShow: 10,

  // Default commit message if detection fails
  defaultCommitType: 'chore',
  defaultCommitMessage: 'update project files'
};

/**
 * Get configuration with potential overrides from .smartgitrc
 */
export async function getConfig() {
  // For now, return default config
  // In Phase 2, we can read from .smartgitrc file
  return CONFIG;
}
