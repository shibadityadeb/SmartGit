/**
 * Runner module for SmartGit
 * Executes Git commands (add, commit, push)
 */

import simpleGit from 'simple-git';

/**
 * Executes the complete git workflow: add, commit, and push
 * @param {string} commitMessage - The commit message to use
 * @param {string} repoPath - Path to the Git repository
 * @returns {Promise<Object>} Result of the operations
 */
export async function executeGitWorkflow(commitMessage, repoPath = process.cwd()) {
  const git = simpleGit(repoPath);
  const results = {
    add: null,
    commit: null,
    push: null,
    errors: []
  };

  try {
    // Step 1: Git add .
    try {
      await git.add('.');
      results.add = { success: true, message: 'Successfully staged all changes' };
    } catch (error) {
      const errorMsg = `Failed to stage changes: ${error.message}`;
      results.errors.push(errorMsg);
      throw new Error(errorMsg);
    }

    // Step 2: Git commit
    try {
      const commitResult = await git.commit(commitMessage);
      results.commit = { 
        success: true, 
        message: 'Successfully created commit',
        hash: commitResult.commit,
        summary: commitResult.summary
      };
    } catch (error) {
      const errorMsg = `Failed to commit changes: ${error.message}`;
      results.errors.push(errorMsg);
      throw new Error(errorMsg);
    }

    // Step 3: Git push
    try {
      // Get current branch
      const status = await git.status();
      const currentBranch = status.current;

      // Check if remote exists
      const remotes = await git.getRemotes();
      if (remotes.length === 0) {
        results.push = { 
          success: false, 
          skipped: true,
          message: 'No remote repository configured. Commit created but not pushed.' 
        };
        return results;
      }

      // Try to push
      const pushResult = await git.push('origin', currentBranch);
      results.push = { 
        success: true, 
        message: `Successfully pushed to origin/${currentBranch}`,
        branch: currentBranch
      };
    } catch (error) {
      // Push might fail for various reasons (no upstream, auth issues, etc.)
      const errorMsg = error.message;
      
      // Check if it's an upstream issue
      if (errorMsg.includes('no upstream') || errorMsg.includes('set-upstream')) {
        const status = await git.status();
        const currentBranch = status.current;
        
        try {
          // Try to set upstream and push
          await git.push(['-u', 'origin', currentBranch]);
          results.push = { 
            success: true, 
            message: `Successfully pushed and set upstream to origin/${currentBranch}`,
            branch: currentBranch
          };
          return results;
        } catch (upstreamError) {
          results.errors.push(`Failed to push: ${upstreamError.message}`);
          results.push = { 
            success: false, 
            message: 'Commit created but push failed. You may need to set upstream or check authentication.',
            error: upstreamError.message
          };
        }
      } else {
        results.errors.push(`Failed to push: ${errorMsg}`);
        results.push = { 
          success: false, 
          message: 'Commit created but push failed.',
          error: errorMsg
        };
      }
    }

    return results;

  } catch (error) {
    throw error;
  }
}

/**
 * Checks if there are uncommitted changes that might cause conflicts
 * @param {string} repoPath - Path to the Git repository
 * @returns {Promise<Object>} Conflict check result
 */
export async function checkForConflicts(repoPath = process.cwd()) {
  const git = simpleGit(repoPath);

  try {
    const status = await git.status();

    // Check for merge conflicts
    if (status.conflicted.length > 0) {
      return {
        hasConflicts: true,
        type: 'merge',
        files: status.conflicted,
        message: 'You have unresolved merge conflicts. Please resolve them before committing.'
      };
    }

    // Check if we're in the middle of a merge, rebase, or cherry-pick
    if (status.isInMerge) {
      return {
        hasConflicts: true,
        type: 'merge',
        message: 'Git merge in progress. Complete or abort the merge before using SmartGit.'
      };
    }

    if (status.isRebasing) {
      return {
        hasConflicts: true,
        type: 'rebase',
        message: 'Git rebase in progress. Complete or abort the rebase before using SmartGit.'
      };
    }

    return {
      hasConflicts: false,
      message: 'No conflicts detected.'
    };

  } catch (error) {
    throw new Error(`Failed to check for conflicts: ${error.message}`);
  }
}

/**
 * Gets information about the current branch and remote
 * @param {string} repoPath - Path to the Git repository
 * @returns {Promise<Object>} Branch and remote information
 */
export async function getBranchInfo(repoPath = process.cwd()) {
  const git = simpleGit(repoPath);

  try {
    const status = await git.status();
    const remotes = await git.getRemotes(true);

    return {
      current: status.current,
      tracking: status.tracking,
      ahead: status.ahead,
      behind: status.behind,
      remotes: remotes.map(r => ({ name: r.name, url: r.refs.push || r.refs.fetch }))
    };

  } catch (error) {
    throw new Error(`Failed to get branch info: ${error.message}`);
  }
}

/**
 * Performs a dry run to validate what would happen
 * @param {string} repoPath - Path to the Git repository
 * @returns {Promise<Object>} Dry run result
 */
export async function dryRun(repoPath = process.cwd()) {
  const git = simpleGit(repoPath);

  try {
    // Check repository status
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return {
        valid: false,
        error: 'Not a git repository'
      };
    }

    // Get status
    const status = await git.status();
    
    // Check for conflicts
    const conflictCheck = await checkForConflicts(repoPath);
    if (conflictCheck.hasConflicts) {
      return {
        valid: false,
        error: conflictCheck.message
      };
    }

    // Get branch info
    const branchInfo = await getBranchInfo(repoPath);

    return {
      valid: true,
      status,
      branchInfo
    };

  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}
