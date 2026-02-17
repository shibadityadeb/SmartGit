#!/usr/bin/env node

/**
 * SmartGit CLI
 * Main entry point for the SmartGit command-line tool
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { analyzeChanges, getChangeSummary } from '../lib/analyzer.js';
import { generateCommitMessage, generateAlternatives } from '../lib/suggester.js';
import { executeGitWorkflow, checkForConflicts, getBranchInfo } from '../lib/runner.js';
import { CONFIG } from '../lib/config.js';

const program = new Command();

// CLI Configuration
program
  .name('smartgit')
  .description('A CLI tool that helps developers write better Git commit messages and automate push workflows')
  .version('2.0.0');

// Main push command
program
  .command('push')
  .description('Analyze changes, suggest commit message, and push to remote')
  .option('--staged', 'Analyze only staged changes')
  .option('--unstaged', 'Analyze only unstaged changes')
  .option('--all', 'Analyze all changes since last commit (default)', true)
  .action(async (options) => {
    try {
      // Determine mode from options
      let mode = 'all';
      if (options.staged) {
        mode = 'staged';
      } else if (options.unstaged) {
        mode = 'unstaged';
      }
      
      await runSmartGitPush({ mode });
    } catch (error) {
      console.error(chalk.red('✖'), chalk.red(error.message));
      process.exit(1);
    }
  });

// Info command (bonus)
program
  .command('info')
  .description('Display current repository information')
  .action(async () => {
    try {
      await showRepositoryInfo();
    } catch (error) {
      console.error(chalk.red('✖'), chalk.red(error.message));
      process.exit(1);
    }
  });

/**
 * Main function for the push workflow
 */
async function runSmartGitPush(options = {}) {
  const { mode = 'all' } = options;
  
  console.log(chalk.bold.cyan('\n🚀 SmartGit - Intelligent Git Automation\n'));

  // Step 1: Check for conflicts
  console.log(chalk.gray('Checking for conflicts...'));
  const conflictCheck = await checkForConflicts();
  if (conflictCheck.hasConflicts) {
    console.error(chalk.red('✖'), chalk.red(conflictCheck.message));
    process.exit(1);
  }

  // Step 2: Analyze changes (HEAD-based analysis)
  console.log(chalk.gray(`Analyzing ${mode === 'all' ? 'all changes' : mode + ' changes'} since last commit...\n`));
  const analysis = await analyzeChanges(process.cwd(), { mode });

  if (!analysis.hasChanges) {
    console.log(chalk.yellow('ℹ'), chalk.yellow(analysis.message));
    return;
  }
  
  // Display analysis scope
  if (analysis.analysisScope) {
    console.log(chalk.gray(`Analysis scope: ${analysis.analysisScope}\n`));
  }
  
  if (analysis.isFirstCommit) {
    console.log(chalk.cyan('ℹ'), chalk.cyan('This will be your first commit\n'));
  }

  // Step 3: Display changes summary
  displayChanges(analysis);

  // Step 4: Generate commit message
  const suggestedMessage = generateCommitMessage(analysis);
  
  if (!suggestedMessage) {
    console.error(chalk.red('✖'), chalk.red('Failed to generate commit message'));
    process.exit(1);
  }

  console.log(chalk.bold('\n📝 Suggested Commit Message:'));
  console.log(chalk.green(`   ${suggestedMessage}\n`));

  // Step 5: Get branch info
  const branchInfo = await getBranchInfo();
  console.log(chalk.gray(`Current branch: ${branchInfo.current}`));
  if (branchInfo.remotes.length > 0) {
    console.log(chalk.gray(`Remote: ${branchInfo.remotes[0].name} (${branchInfo.remotes[0].url})\n`));
  } else {
    console.log(chalk.yellow('⚠'), chalk.yellow('No remote repository configured\n'));
  }

  // Step 6: Ask for confirmation
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '✓ Use this message and push', value: 'use' },
        { name: '✎ Edit the message', value: 'edit' },
        { name: '✕ Cancel', value: 'cancel' }
      ]
    }
  ]);

  let finalMessage = suggestedMessage;

  if (action === 'cancel') {
    console.log(chalk.yellow('\nOperation cancelled.'));
    return;
  }

  if (action === 'edit') {
    const { editedMessage } = await inquirer.prompt([
      {
        type: 'input',
        name: 'editedMessage',
        message: 'Enter your commit message:',
        default: suggestedMessage,
        validate: (input) => {
          return input.trim().length > 0 || 'Commit message cannot be empty';
        }
      }
    ]);
    finalMessage = editedMessage.trim();
  }

  // Step 7: Execute git workflow
  console.log(chalk.bold.cyan('\n⚙️  Executing Git workflow...\n'));

  const results = await executeGitWorkflow(finalMessage);

  // Display results
  if (results.add && results.add.success) {
    console.log(chalk.green('✓'), chalk.green('Staged all changes'));
  }

  if (results.commit && results.commit.success) {
    console.log(chalk.green('✓'), chalk.green(`Committed: ${finalMessage}`));
    if (results.commit.hash) {
      console.log(chalk.gray(`  Commit hash: ${results.commit.hash}`));
    }
  }

  if (results.push) {
    if (results.push.success) {
      console.log(chalk.green('✓'), chalk.green(results.push.message));
    } else if (results.push.skipped) {
      console.log(chalk.yellow('⚠'), chalk.yellow(results.push.message));
    } else {
      console.log(chalk.yellow('⚠'), chalk.yellow(results.push.message));
      if (results.push.error) {
        console.log(chalk.gray(`  Error: ${results.push.error}`));
      }
      console.log(chalk.gray('  You can manually push using: git push'));
    }
  }

  if (results.errors.length === 0 && results.push && results.push.success) {
    console.log(chalk.bold.green('\n🎉 All done! Your changes have been pushed successfully.\n'));
  } else if (results.errors.length === 0 && results.commit && results.commit.success) {
    console.log(chalk.bold.green('\n✓ Commit created successfully!\n'));
  }
}

/**
 * Display changes summary
 */
function displayChanges(analysis) {
  const { summary, changeTypes } = analysis;

  console.log(chalk.bold('📊 Changes Summary:'));
  console.log(chalk.gray(`   ${getChangeSummary(analysis)}\n`));

  // Show files list (limited to CONFIG.maxFilesToShow)
  const maxFiles = CONFIG.maxFilesToShow;
  let fileCount = 0;

  if (changeTypes.created.length > 0) {
    console.log(chalk.green('   Created:'));
    const toShow = changeTypes.created.slice(0, maxFiles - fileCount);
    toShow.forEach(file => {
      console.log(chalk.green(`     + ${file}`));
    });
    fileCount += toShow.length;
    if (changeTypes.created.length > toShow.length) {
      console.log(chalk.gray(`     ... and ${changeTypes.created.length - toShow.length} more`));
    }
  }

  if (changeTypes.modified.length > 0 && fileCount < maxFiles) {
    console.log(chalk.yellow('   Modified:'));
    const toShow = changeTypes.modified.slice(0, maxFiles - fileCount);
    toShow.forEach(file => {
      console.log(chalk.yellow(`     ~ ${file}`));
    });
    fileCount += toShow.length;
    if (changeTypes.modified.length > toShow.length) {
      console.log(chalk.gray(`     ... and ${changeTypes.modified.length - toShow.length} more`));
    }
  }

  if (changeTypes.deleted.length > 0 && fileCount < maxFiles) {
    console.log(chalk.red('   Deleted:'));
    const toShow = changeTypes.deleted.slice(0, maxFiles - fileCount);
    toShow.forEach(file => {
      console.log(chalk.red(`     - ${file}`));
    });
    fileCount += toShow.length;
    if (changeTypes.deleted.length > toShow.length) {
      console.log(chalk.gray(`     ... and ${changeTypes.deleted.length - toShow.length} more`));
    }
  }

  if (changeTypes.renamed.length > 0 && fileCount < maxFiles) {
    console.log(chalk.blue('   Renamed:'));
    const toShow = changeTypes.renamed.slice(0, maxFiles - fileCount);
    toShow.forEach(rename => {
      console.log(chalk.blue(`     → ${rename.from} → ${rename.to}`));
    });
    fileCount += toShow.length;
    if (changeTypes.renamed.length > toShow.length) {
      console.log(chalk.gray(`     ... and ${changeTypes.renamed.length - toShow.length} more`));
    }
  }

  console.log('');
}

/**
 * Display repository information
 */
async function showRepositoryInfo() {
  console.log(chalk.bold.cyan('\n📍 Repository Information\n'));

  try {
    const branchInfo = await getBranchInfo();

    console.log(chalk.bold('Branch:'));
    console.log(`  Current: ${chalk.green(branchInfo.current)}`);
    
    if (branchInfo.tracking) {
      console.log(`  Tracking: ${chalk.gray(branchInfo.tracking)}`);
    }

    if (branchInfo.ahead > 0) {
      console.log(`  ${chalk.yellow(`↑ ${branchInfo.ahead} commit(s) ahead`)}`);
    }

    if (branchInfo.behind > 0) {
      console.log(`  ${chalk.yellow(`↓ ${branchInfo.behind} commit(s) behind`)}`);
    }

    console.log('');
    console.log(chalk.bold('Remotes:'));
    if (branchInfo.remotes.length > 0) {
      branchInfo.remotes.forEach(remote => {
        console.log(`  ${chalk.cyan(remote.name)}: ${chalk.gray(remote.url)}`);
      });
    } else {
      console.log(chalk.gray('  No remote repositories configured'));
    }

    console.log('');

    // Get changes
    const analysis = await analyzeChanges();
    if (analysis.hasChanges) {
      console.log(chalk.bold('Changes:'));
      console.log(`  ${chalk.yellow(getChangeSummary(analysis))}`);
    } else {
      console.log(chalk.bold('Changes:'));
      console.log(`  ${chalk.green('No uncommitted changes')}`);
    }

    console.log('');

  } catch (error) {
    console.error(chalk.red('Failed to get repository info:'), error.message);
  }
}

// Parse arguments and execute
program.parse(process.argv);

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
