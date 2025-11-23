#!/usr/bin/env node

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const figlet = require('figlet');
const { Command } = require('commander');
const fs = require('fs');
const os = require('os');

// Use stealth plugin to bypass bot detection
puppeteer.use(StealthPlugin());

// Dynamic imports for ESM modules
let ora, chalk, boxen;

// Browser detection paths by platform
const BROWSER_PATHS = {
  darwin: [
    { name: 'Google Chrome', path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' },
    { name: 'Brave Browser', path: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' },
    {
      name: 'Microsoft Edge',
      path: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    },
    { name: 'Chromium', path: '/Applications/Chromium.app/Contents/MacOS/Chromium' },
    { name: 'Arc', path: '/Applications/Arc.app/Contents/MacOS/Arc' },
    { name: 'Opera', path: '/Applications/Opera.app/Contents/MacOS/Opera' },
    { name: 'Vivaldi', path: '/Applications/Vivaldi.app/Contents/MacOS/Vivaldi' },
  ],
  win32: [
    { name: 'Google Chrome', path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
    {
      name: 'Google Chrome (x86)',
      path: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    },
    {
      name: 'Brave Browser',
      path: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    },
    {
      name: 'Microsoft Edge',
      path: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    },
  ],
  linux: [
    { name: 'Google Chrome', path: '/usr/bin/google-chrome' },
    { name: 'Google Chrome (Stable)', path: '/usr/bin/google-chrome-stable' },
    { name: 'Chromium', path: '/usr/bin/chromium' },
    { name: 'Chromium Browser', path: '/usr/bin/chromium-browser' },
    { name: 'Brave Browser', path: '/usr/bin/brave-browser' },
    { name: 'Microsoft Edge', path: '/usr/bin/microsoft-edge' },
  ],
};

// Detect installed browsers
function getInstalledBrowsers() {
  const platform = os.platform();
  const browsers = BROWSER_PATHS[platform] || [];
  return browsers.filter((browser) => fs.existsSync(browser.path));
}

// Prompt user to select a browser
async function selectBrowser(installedBrowsers) {
  const { default: inq } = await import('inquirer');

  const choices = installedBrowsers.map((b) => ({
    name: `${b.name}`,
    value: b.path,
    short: b.name,
  }));

  const { browserPath } = await inq.prompt([
    {
      type: 'rawlist',
      name: 'browserPath',
      message: 'Select a browser to use:',
      choices,
      pageSize: 10,
    },
  ]);

  return browserPath;
}

// Prompt for missing credentials
async function promptCredentials(config) {
  const { default: inq } = await import('inquirer');

  const questions = [];

  if (!config.cpanelUrl) {
    questions.push({
      type: 'input',
      name: 'cpanelUrl',
      message: 'cPanel URL (e.g., https://example.com:2083):',
      validate: (input) => {
        if (!input.trim()) return 'URL is required';
        try {
          new URL(input.trim());
          return true;
        } catch {
          return 'Please enter a valid URL (e.g., https://example.com:2083)';
        }
      },
    });
  }

  if (!config.username) {
    questions.push({
      type: 'input',
      name: 'username',
      message: 'cPanel username:',
      validate: (input) => (input.trim() ? true : 'Username is required'),
    });
  }

  if (!config.password) {
    questions.push({
      type: 'password',
      name: 'password',
      message: 'cPanel password:',
      mask: '*',
      validate: (input) => (input ? true : 'Password is required'),
    });
  }

  // Only ask about headless if not set via CLI flag
  if (!config.headless) {
    questions.push({
      type: 'confirm',
      name: 'headless',
      message: 'Run in headless mode (no browser window)?',
      default: false,
    });
  }

  if (questions.length === 0) return config;

  console.log('');
  const answers = await inq.prompt(questions);

  return {
    ...config,
    cpanelUrl: answers.cpanelUrl || config.cpanelUrl,
    username: answers.username || config.username,
    password: answers.password || config.password,
    headless: answers.headless ? 'new' : config.headless,
  };
}

// Progress tracking
let totalDeleted = 0;
let foldersScanned = 0;
let spinner = null;
const deletionLog = []; // { path, items, status }

// Progress display helpers
function updateProgress(currentPath, action = 'Scanning') {
  // Handle both Linux (/home/) and macOS (/Users/) paths
  const shortPath = currentPath.replace(/^\/home\/[^/]+/, '~').replace(/^\/Users\/[^/]+/, '~');
  const truncatedPath = shortPath.length > 50 ? '...' + shortPath.slice(-47) : shortPath;
  if (spinner && spinner.isSpinning) {
    spinner.text = `${action} ${chalk.cyan(truncatedPath)} ${chalk.gray(`| ${foldersScanned} folders | ${totalDeleted} items`)}`;
  }
}

function printSummaryTable() {
  if (deletionLog.length === 0) {
    console.log(chalk.gray('  No items found in trash.\n'));
    return;
  }

  // Calculate column widths
  const pathWidth = Math.min(50, Math.max(...deletionLog.map((r) => r.path.length), 4));
  const itemsWidth = 7;
  const statusWidth = 8;

  // Print header
  console.log('');
  console.log(
    chalk.bold.white(
      '  ' + 'PATH'.padEnd(pathWidth) + '  ' + 'ITEMS'.padStart(itemsWidth) + '  ' + 'STATUS'
    )
  );
  console.log(
    chalk.gray(
      '  ' + '─'.repeat(pathWidth) + '  ' + '─'.repeat(itemsWidth) + '  ' + '─'.repeat(statusWidth)
    )
  );

  // Print rows
  for (const row of deletionLog) {
    const path =
      row.path.length > pathWidth
        ? '...' + row.path.slice(-(pathWidth - 3))
        : row.path.padEnd(pathWidth);
    const items = String(row.items).padStart(itemsWidth);
    const status =
      row.status === 'deleted'
        ? chalk.green('✓ done')
        : row.status === 'skipped'
          ? chalk.yellow('○ skip')
          : row.status === 'empty'
            ? chalk.gray('- empty')
            : chalk.red('✗ fail');
    console.log('  ' + chalk.white(path) + '  ' + chalk.cyan(items) + '  ' + status);
  }
  console.log('');
}

// CLI Setup
const program = new Command();
program
  .name('cptrash')
  .description('Recursively delete cPanel File Manager trash contents')
  .version('1.0.0')
  .option('-u, --url <url>', 'cPanel URL (e.g., https://example.com:2083)')
  .option('-n, --username <username>', 'cPanel username')
  .option('-p, --password <password>', 'cPanel password')
  .option('-d, --dry-run', 'Preview what would be deleted without actually deleting')
  .option('-H, --headless', 'Run browser in headless mode')
  .option('-t, --timeout <ms>', 'Timeout in milliseconds', '30000')
  .option('-b, --browser <path>', 'Custom browser executable path')
  .parse(process.argv);

const options = program.opts();

// Configuration from CLI args > environment variables > defaults
const CONFIG = {
  cpanelUrl: options.url || process.env.CPANEL_URL || '',
  username: options.username || process.env.CPANEL_USERNAME || '',
  password: options.password || process.env.CPANEL_PASSWORD || '',
  trashPath: '/.trash',
  headless: options.headless || process.env.HEADLESS === 'true' ? 'new' : false,
  slowMo: 0,
  timeout: parseInt(options.timeout) || parseInt(process.env.TIMEOUT) || 30000,
  browserPath: options.browser || process.env.BROWSER_PATH || null,
};

const DRY_RUN = options.dryRun || false;

// Global browser reference for cleanup
let browser = null;

// Handle Ctrl+C and other termination signals
async function cleanup() {
  console.log('\n\nInterrupted! Cleaning up...');
  if (spinner) spinner.stop();
  if (browser) {
    try {
      await browser.close();
    } catch (e) {
      // Browser might already be closed
    }
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function login(page) {
  spinner = ora('Logging into cPanel...').start();

  await page.goto(CONFIG.cpanelUrl, { waitUntil: 'networkidle2' });

  // Check if already logged in (redirected to dashboard)
  let currentUrl = page.url();
  if (currentUrl.includes('/cpsess') || currentUrl.includes('/frontend/')) {
    spinner.succeed('Already logged in');
    return;
  }

  // Wait for Cloudflare/bot verification to complete
  const verificationText = await page.evaluate(() => document.body?.innerText || '');
  if (
    verificationText.includes('verified') ||
    verificationText.includes('Checking') ||
    verificationText.includes('Please wait')
  ) {
    spinner.text = 'Waiting for verification to complete...';

    // Wait up to 30 seconds for verification to pass
    try {
      await page.waitForFunction(
        () => {
          const text = document.body?.innerText || '';
          return (
            !text.includes('verified') &&
            !text.includes('Checking') &&
            !text.includes('Please wait')
          );
        },
        { timeout: 30000 }
      );
      await delay(2000); // Extra wait after verification
    } catch (e) {
      spinner.fail('Verification page did not complete');
      throw new Error(
        'Bot verification did not complete. Try again or check if the site is blocking automated access.'
      );
    }
  }

  // Re-check if we're now logged in after verification
  currentUrl = page.url();
  if (currentUrl.includes('/cpsess') || currentUrl.includes('/frontend/')) {
    spinner.succeed('Already logged in');
    return;
  }

  // Wait for login form to be visible - try multiple selectors
  const loginFormSelectors = [
    '#user',
    'input[name="user"]',
    'input[name="login"]',
    'input[name="username"]',
    'input[type="text"]',
    '#login-form input',
    'form input[type="text"]:first-of-type',
  ];

  let foundForm = false;
  for (const selector of loginFormSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 3000 });
      foundForm = true;
      break;
    } catch (e) {
      // Try next selector
    }
  }

  if (!foundForm) {
    // Take screenshot for debugging
    const debugDir = 'debug';
    if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
    await page.screenshot({ path: `${debugDir}/login-form-not-found.png` });
    const pageUrl = page.url();
    spinner.fail(`Login form not found at: ${pageUrl}`);
    console.log('Screenshot saved to debug/login-form-not-found.png');
    throw new Error('Could not find login form on the page. Check debug/login-form-not-found.png');
  }

  await delay(500);

  // Enter username
  const userInput = await page.$('#user, input[name="user"], input[name="login"]');
  if (userInput) {
    await userInput.click({ clickCount: 3 }); // Select all existing text
    await userInput.type(CONFIG.username);
  }

  await delay(300);

  // Enter password
  const passInput = await page.$('#pass, input[name="pass"], input[type="password"]');
  if (passInput) {
    await passInput.click({ clickCount: 3 }); // Select all existing text
    await passInput.type(CONFIG.password);
  }

  await delay(300);

  // Try multiple ways to submit the form
  const loginBtnSelectors = [
    '#login_submit',
    'button[type="submit"]',
    'input[type="submit"]',
    '#btnLogin',
    '.login-submit',
    'button#login_submit',
    'form button',
    '[id*="login"] button',
    '[class*="login"] button',
  ];

  let clicked = false;
  for (const selector of loginBtnSelectors) {
    const loginBtn = await page.$(selector);
    if (loginBtn) {
      await loginBtn.click();
      clicked = true;
      break;
    }
  }

  // Fallback: Press Enter to submit
  if (!clicked) {
    await page.keyboard.press('Enter');
  }

  spinner.text = 'Waiting for login to complete...';

  // Wait for login to complete - wait for cPanel session URL
  try {
    await page.waitForFunction(
      () => window.location.href.includes('/cpsess') || window.location.href.includes('/frontend/'),
      { timeout: 60000 } // 60 seconds to login
    );
  } catch (e) {
    // Login didn't redirect to session URL
    const finalUrl = page.url();
    spinner.fail(`Login failed - still at: ${finalUrl}`);
    throw new Error(
      'Login failed. Please check your CPANEL_USERNAME and CPANEL_PASSWORD in .env file'
    );
  }

  spinner.succeed('Logged in');
}

async function navigateToFileManager(page) {
  try {
    // Get the session URL from current page
    const currentUrl = page.url();
    // Extract the session part (e.g., /cpsessXXXXX/)
    const sessionMatch = currentUrl.match(/(\/cpsess\d+\/)/);
    const sessionPath = sessionMatch ? sessionMatch[1] : '/';

    // Navigate directly to File Manager with trash directory
    const fileManagerUrl = `${CONFIG.cpanelUrl}${sessionPath}frontend/jupiter/filemanager/index.html?dir=%2Fhome%2F${CONFIG.username}%2F.trash`;

    // Use domcontentloaded instead of networkidle2 to avoid timeout on slow connections
    await page.goto(fileManagerUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (error) {
    throw new Error(`Failed to navigate to File Manager: ${error.message}`);
  }
}

async function waitForFileManager(page, maxRetries = 3) {
  const timeout = CONFIG.timeout || 30000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Wait for the file table container to be present
      await page.waitForSelector('.yui-dt-data', { timeout });

      // Wait for table to have rows (content loaded) or confirm it's truly empty
      await page.waitForFunction(
        () => {
          const table = document.querySelector('.yui-dt-data');
          if (!table) return false;
          const hasRows = table.querySelectorAll('tr.yui-dt-rec').length > 0;
          const isEmpty = document.querySelector('.yui-dt-empty') !== null;
          return hasRows || isEmpty;
        },
        { timeout }
      );

      // Wait for content to stabilize (row count doesn't change)
      let previousCount = -1;
      let stableChecks = 0;
      const maxStableChecks = 3;

      while (stableChecks < maxStableChecks) {
        const currentCount = await page.evaluate(() => {
          return document.querySelectorAll('.yui-dt-data tr.yui-dt-rec').length;
        });

        if (currentCount === previousCount) {
          stableChecks++;
        } else {
          stableChecks = 0;
          previousCount = currentCount;
        }

        if (stableChecks < maxStableChecks) {
          await delay(100);
        }
      }

      // Success - content is loaded and stable
      await delay(150);
      return true;
    } catch (error) {
      if (attempt < maxRetries) {
        await delay(500 * attempt); // Exponential backoff
        continue;
      }
      // Final attempt failed, but continue anyway
      await delay(200);
      return false;
    }
  }

  return false;
}

async function getItems(page, retryOnEmpty = true) {
  // Wait for the file list to populate
  await delay(150);

  const fetchItems = async () => {
    return await page.evaluate(() => {
      const result = [];

      // cPanel uses YUI DataTable - look for .yui-dt-data rows
      const dataTable = document.querySelector('.yui-dt-data');

      if (dataTable) {
        const rows = dataTable.querySelectorAll('tr.yui-dt-rec');
        rows.forEach((row) => {
          // Get filename from span.renameable
          const nameSpan = row.querySelector('span.renameable');
          if (!nameSpan) return;

          const name = nameSpan.getAttribute('title') || nameSpan.textContent?.trim() || '';
          if (!name || name === '..' || name === '.') return;

          // Check for folder by looking at the icon (fa-folder) or mimetype column
          const hasfolderIcon = row.querySelector('.fa-folder') !== null;
          const mimeCell = row.querySelector('td[class*="mimetype"]');
          const isDirectory = mimeCell?.textContent?.includes('directory') || false;

          const isFolder = hasfolderIcon || isDirectory;

          result.push({ name, isFolder });
        });
      }

      return result;
    });
  };

  let items = await fetchItems();

  // If empty, retry a few times to make sure it's truly empty (not just slow loading)
  if (items.length === 0 && retryOnEmpty) {
    for (let i = 0; i < 3; i++) {
      await delay(500); // Wait 500ms between retries
      items = await fetchItems();
      if (items.length > 0) break;
    }
  }

  return items;
}

async function selectItemsByName(page, items) {
  // Select items by finding the link/text element and locating nearby checkbox or clicking the row

  let selectedCount = 0;

  for (const item of items) {
    const selected = await page.evaluate((itemName) => {
      // Find the link or element containing this item name
      const allLinks = document.querySelectorAll('a');
      let targetLink = null;

      for (const link of allLinks) {
        if (link.textContent?.trim() === itemName) {
          targetLink = link;
          break;
        }
      }

      if (!targetLink) return false;

      // Find the parent row (tr, div with row class, etc.)
      const row =
        targetLink.closest('tr') ||
        targetLink.closest('[class*="row"]') ||
        targetLink.parentElement?.parentElement;

      if (!row) return false;

      // Look for checkbox in this row
      const checkbox = row.querySelector('input[type="checkbox"]');
      if (checkbox && !checkbox.checked) {
        checkbox.click();
        return true;
      }

      // Try to click the row itself to select it
      if (row.classList.contains('selected') === false) {
        // Try to trigger selection by clicking on the row
        row.click();
        return true;
      }

      return false;
    }, item.name);

    if (selected) {
      selectedCount++;
      await delay(150);
    }
  }

  return selectedCount > 0;
}

async function selectAllItems(page) {
  // Click the "Select All" toolbar button directly
  const selectAllButtonSelectors = [
    'a:has-text("Select All")',
    'button:has-text("Select All")',
    '[title="Select All"]',
    'a[title="Select All"]',
    'button[title="Select All"]',
  ];

  // Try using page.evaluate to find and click the Select All button by text
  const clicked = await page.evaluate(() => {
    // Find all links and buttons
    const elements = document.querySelectorAll('a, button, span');
    for (const el of elements) {
      const text = el.textContent?.trim();
      if (text === 'Select All') {
        el.click();
        return true;
      }
    }
    // Try by title attribute
    const byTitle = document.querySelector('[title="Select All"]');
    if (byTitle) {
      byTitle.click();
      return true;
    }
    return false;
  });

  if (clicked) {
    await delay(150);
    return true;
  }

  // Fallback: Try specific selectors
  for (const selector of selectAllButtonSelectors) {
    try {
      const btn = await page.$(selector);
      if (btn) {
        await btn.click();
        await delay(150);
        return true;
      }
    } catch (e) {
      // Selector might not be valid for this page
    }
  }

  return false;
}

async function deleteSelectedItems(page) {
  // Call actionHandler('delete') directly via JavaScript
  const deleted = await page.evaluate(() => {
    if (typeof actionHandler === 'function') {
      actionHandler('delete');
      return true;
    }

    // Fallback: Click the <li id="action-delete"> element
    const deleteLi = document.querySelector('#action-delete, li[id="action-delete"]');
    if (deleteLi) {
      deleteLi.classList.remove('disabled');
      deleteLi.click();
      return true;
    }

    // Fallback: Find and click the <a> inside
    const deleteLink = document.querySelector('a[title="Delete"]');
    if (deleteLink) {
      deleteLink.click();
      return true;
    }

    return false;
  });

  if (!deleted) return;

  await delay(150);

  // Click "Delete Files" button in the confirmation modal
  await page.evaluate(() => {
    const deleteModal = document.querySelector('#delete, #delete_c, .yui-dialog');
    if (deleteModal) {
      const deleteFilesBtn = deleteModal.querySelector('button.default');
      if (deleteFilesBtn) {
        deleteFilesBtn.click();
        return;
      }
      const buttons = deleteModal.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent?.trim() === 'Delete Files') {
          btn.click();
          return;
        }
      }
    }
    // Fallback: Find any button with "Delete Files" text
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      if (btn.textContent?.trim() === 'Delete Files') {
        btn.click();
        return;
      }
    }
  });

  // Wait for deletion to complete
  await delay(500);
}

async function selectAndDeleteItem(page, itemName, isDryRun = false) {
  // Wait a bit for the file list to be ready
  await delay(300);

  // Select a specific item by name - cPanel uses row selection with yui-dt-selected class
  const selected = await page.evaluate((name) => {
    // First, deselect any currently selected rows
    const selectedRows = document.querySelectorAll('tr.yui-dt-selected');
    selectedRows.forEach((row) => row.classList.remove('yui-dt-selected'));

    // Find the row with the matching filename in span.renameable
    const allSpans = document.querySelectorAll('span.renameable');
    for (const span of allSpans) {
      if (span.textContent?.trim() === name || span.getAttribute('title') === name) {
        const row = span.closest('tr');
        if (row) {
          // Add the selected class
          row.classList.add('yui-dt-selected');
          // Also try clicking the row to trigger any event handlers
          row.click();
          return true;
        }
      }
    }
    return false;
  }, itemName);

  if (!selected) {
    // Retry once after a short delay
    await delay(500);
    const retrySelected = await page.evaluate((name) => {
      const allSpans = document.querySelectorAll('span.renameable');
      for (const span of allSpans) {
        if (span.textContent?.trim() === name || span.getAttribute('title') === name) {
          const row = span.closest('tr');
          if (row) {
            row.classList.add('yui-dt-selected');
            row.click();
            return true;
          }
        }
      }
      return false;
    }, itemName);

    if (!retrySelected) return false;
  }

  if (isDryRun) return true;

  await delay(200);
  await deleteSelectedItems(page);
  await delay(300);
  return true;
}

async function navigateToFolder(page, folderName, currentPath) {
  try {
    // Build new path
    const newPath = currentPath.endsWith('/')
      ? `${currentPath}${folderName}`
      : `${currentPath}/${folderName}`;

    // Get current URL and update the dir parameter
    const currentUrl = page.url();
    const url = new URL(currentUrl);
    url.searchParams.set('dir', newPath);

    await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for network to be fully idle and file list to load
    await waitForFileManager(page);

    return true;
  } catch (error) {
    throw new Error(`Failed to navigate to folder "${folderName}": ${error.message}`);
  }
}

async function getCurrentPath(page) {
  // Get current directory path from the URL or breadcrumb
  const currentUrl = page.url();
  const url = new URL(currentUrl);
  return url.searchParams.get('dir') || `/home/${CONFIG.username}/.trash`;
}

async function deleteTrashContents(page, currentPath = null, depth = 0) {
  if (!currentPath) {
    currentPath = await getCurrentPath(page);
  }

  // Handle both Linux (/home/) and macOS (/Users/) paths
  const shortPath = currentPath.replace(/^\/home\/[^/]+/, '~').replace(/^\/Users\/[^/]+/, '~');
  foldersScanned++;
  updateProgress(currentPath, 'Scanning');

  // Get current items
  const items = await getItems(page);

  // If empty, log and return
  if (items.length === 0) {
    deletionLog.push({ path: shortPath, items: 0, status: 'empty' });
    return;
  }

  // Separate folders and files
  const folders = items.filter((item) => item.isFolder);
  const files = items.filter((item) => !item.isFolder);

  // Process folders first (depth-first deletion)
  for (const folder of folders) {
    const folderPath = currentPath.endsWith('/')
      ? `${currentPath}${folder.name}`
      : `${currentPath}/${folder.name}`;

    updateProgress(folderPath, 'Entering');
    await navigateToFolder(page, folder.name, currentPath);

    await deleteTrashContents(page, folderPath, depth + 1);

    // Navigate back to current directory
    updateProgress(currentPath, 'Returning to');
    const url = new URL(page.url());
    url.searchParams.set('dir', currentPath);
    await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForFileManager(page);

    // Delete the folder we just processed (it should now be empty)
    if (!DRY_RUN) {
      updateProgress(currentPath, `Deleting folder ${folder.name} in`);
      let deleted = await selectAndDeleteItem(page, folder.name);

      // Retry with page refresh if first attempt fails
      if (!deleted) {
        await delay(500);
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
        await waitForFileManager(page);
        deleted = await selectAndDeleteItem(page, folder.name);
      }

      if (deleted) {
        await waitForFileManager(page);
        totalDeleted++;
      }
    } else {
      totalDeleted++;
    }
  }

  // Now delete all remaining files
  const currentItems = await getItems(page);
  const fileCount = currentItems.filter((item) => !item.isFolder).length;

  if (fileCount > 0) {
    if (DRY_RUN) {
      totalDeleted += fileCount;
      deletionLog.push({ path: shortPath, items: fileCount, status: 'skipped' });
    } else {
      updateProgress(currentPath, `Deleting ${fileCount} files in`);
      let selectionSuccess = await selectAllItems(page);
      if (!selectionSuccess) {
        selectionSuccess = await selectItemsByName(page, currentItems);
      }

      if (selectionSuccess) {
        await delay(200);
        await deleteSelectedItems(page);
        await delay(150);

        // Verify deletion and retry if needed
        const remainingItems = await getItems(page);
        let deletedCount = fileCount - remainingItems.length;
        totalDeleted += deletedCount;

        if (remainingItems.length > 0) {
          let retrySuccess = await selectAllItems(page);
          if (!retrySuccess) {
            retrySuccess = await selectItemsByName(page, remainingItems);
          }
          if (retrySuccess) {
            await delay(200);
            await deleteSelectedItems(page);
            await delay(150);
            totalDeleted += remainingItems.length;
            deletedCount += remainingItems.length;
          }
        }

        deletionLog.push({
          path: shortPath,
          items: deletedCount,
          status: deletedCount > 0 ? 'deleted' : 'failed',
        });
      } else {
        deletionLog.push({ path: shortPath, items: 0, status: 'failed' });
      }
    }
  } else if (files.length > 0) {
    // Had files initially but they're all gone now (were folders we already deleted)
    deletionLog.push({
      path: shortPath,
      items: files.length,
      status: DRY_RUN ? 'skipped' : 'deleted',
    });
  }
}

async function main() {
  // Dynamic import ESM modules
  ora = (await import('ora')).default;
  chalk = (await import('chalk')).default;
  boxen = (await import('boxen')).default;

  // ASCII Art Header
  console.log('');
  console.log(chalk.cyan(figlet.textSync('cptrash', { font: 'Small' })));
  console.log(chalk.gray('  cPanel File Manager Trash Cleanup\n'));

  // Show dry run banner
  if (DRY_RUN) {
    console.log(
      boxen(chalk.yellow('🔍 DRY RUN MODE - No files will be deleted'), {
        padding: 0,
        margin: { top: 0, bottom: 1, left: 0, right: 0 },
        borderStyle: 'round',
        borderColor: 'yellow',
      })
    );
  }

  // Prompt for missing credentials interactively
  const credentials = await promptCredentials(CONFIG);
  CONFIG.cpanelUrl = credentials.cpanelUrl;
  CONFIG.username = credentials.username;
  CONFIG.password = credentials.password;
  CONFIG.headless = credentials.headless;

  const startTime = Date.now();

  const launchOptions = {
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    protocolTimeout: 300000, // 5 minutes timeout for protocol calls
    timeout: 60000, // 1 minute for launch
  };

  // Determine browser path
  let browserPath = CONFIG.browserPath;
  let browserName = 'Custom browser';

  if (!browserPath) {
    const installedBrowsers = getInstalledBrowsers();

    if (installedBrowsers.length === 0) {
      console.log(chalk.red('Error: No compatible browser found.\n'));
      console.log(chalk.white('Please install one of the following browsers:'));
      console.log(chalk.cyan('  - Google Chrome'));
      console.log(chalk.cyan('  - Brave Browser'));
      console.log(chalk.cyan('  - Microsoft Edge'));
      console.log(chalk.cyan('  - Chromium\n'));
      console.log(chalk.gray('Or specify a browser path with -b flag'));
      process.exit(1);
    } else if (installedBrowsers.length === 1) {
      browserPath = installedBrowsers[0].path;
      browserName = installedBrowsers[0].name;
      console.log(chalk.gray(`  Using ${browserName}\n`));
    } else {
      console.log('');
      browserPath = await selectBrowser(installedBrowsers);
      browserName =
        installedBrowsers.find((b) => b.path === browserPath)?.name || 'Selected browser';
      console.log('');
    }
  }

  // Verify browser exists
  if (!fs.existsSync(browserPath)) {
    console.log(chalk.red(`Error: Browser not found at path:\n  ${browserPath}\n`));
    console.log(chalk.gray('Please check the path or install a supported browser'));
    process.exit(1);
  }

  launchOptions.executablePath = browserPath;

  spinner = ora(`Launching ${browserName}...`).start();
  try {
    browser = await puppeteer.launch(launchOptions);
    spinner.succeed(`Launched ${browserName}`);

    // Handle browser disconnection
    browser.on('disconnected', () => {
      console.log(chalk.red('\nBrowser was disconnected unexpectedly'));
      process.exit(1);
    });
  } catch (err) {
    spinner.fail(`Failed to launch ${browserName}`);
    console.log(chalk.red(`\nError: ${err.message}\n`));
    console.log(
      chalk.gray('Try a different browser with -b flag or check if the browser is already running')
    );
    process.exit(1);
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    page.setDefaultTimeout(CONFIG.timeout);

    await login(page);

    spinner = ora('Navigating to trash folder...').start();
    await navigateToFileManager(page);
    await waitForFileManager(page);
    spinner.succeed('Navigated to trash folder');

    // Start progress spinner for scanning/deletion
    console.log('');
    spinner = ora({ text: 'Scanning trash...', spinner: 'dots' }).start();

    await deleteTrashContents(page);

    // Stop spinner and show results
    spinner.succeed(
      `Processed ${foldersScanned} folders, ${totalDeleted} items ${DRY_RUN ? 'found' : 'deleted'}`
    );

    // Print summary table
    printSummaryTable();

    // Calculate elapsed time
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Boxed Summary
    const summaryTitle = DRY_RUN ? '🔍 Dry Run Complete!' : '✅ Cleanup Complete!';
    const itemsLabel = DRY_RUN ? 'Items found' : 'Items deleted';
    const borderColor = DRY_RUN ? 'yellow' : 'green';

    const summaryText =
      `${summaryTitle}\n\n` +
      `   📁 Folders scanned: ${chalk.cyan(foldersScanned)}\n` +
      `   🗑️  ${itemsLabel}: ${chalk.green(totalDeleted)}\n` +
      `   ⏱️  Time taken: ${chalk.yellow(elapsed + 's')}` +
      (DRY_RUN ? `\n\n   ${chalk.gray('Run without --dry-run to delete')}` : '');

    console.log(
      boxen(summaryText, {
        padding: 1,
        margin: 0,
        borderStyle: 'round',
        borderColor: borderColor,
      })
    );
    console.log('');
  } catch (error) {
    if (spinner) spinner.fail('Error occurred');
    console.error(chalk.red('Error:'), error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the script
main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
