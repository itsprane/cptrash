# cptrash 🗑️

> A powerful CLI tool to recursively delete cPanel File Manager trash contents using Puppeteer automation.

[![npm version](https://img.shields.io/npm/v/cptrash.svg)](https://www.npmjs.com/package/cptrash)
[![Node.js Version](https://img.shields.io/node/v/cptrash.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm downloads](https://img.shields.io/npm/dm/cptrash.svg)](https://www.npmjs.com/package/cptrash)
[![CI](https://github.com/itsprane/cptrash/workflows/CI/badge.svg)](https://github.com/itsprane/cptrash/actions)

## ✨ Features

- 🚀 **Recursive Deletion** - Automatically scans and deletes all files and folders in cPanel's trash directory
- 📊 **Live Progress Display** - Real-time progress bar with folder count and item statistics
- 📋 **Summary Table** - Clean tabular summary showing all processed folders with status
- 🔍 **Dry-Run Mode** - Preview what would be deleted without actually deleting anything
- 🔐 **Interactive Prompts** - Secure credential input with masked passwords (no shell escaping issues!)
- 🌐 **Auto Browser Detection** - Automatically detects installed Chromium-based browsers
- 🎯 **Smart Navigation** - Depth-first deletion ensures folders are removed after their contents
- 🛡️ **Stealth Mode** - Uses Puppeteer Stealth plugin to bypass bot detection
- ⚡ **Robust Error Handling** - Retry logic and network timeout handling for slow connections
- 🎨 **Beautiful CLI** - Colorful output with progress indicators and formatted tables

## 📦 Installation

### Global Installation

```bash
npm install -g cptrash
```

### Using npx (No Installation Required)

```bash
npx cptrash
```

## 🚀 Quick Start

### Interactive Mode (Recommended)

Simply run the command and follow the prompts:

```bash
cptrash
```

You'll be prompted for:

- cPanel URL (e.g., `https://example.com:2083`)
- cPanel username
- cPanel password (masked input)
- Browser selection (if multiple browsers detected)

**Why interactive mode?**

- ✅ Passwords with special characters work without escaping
- ✅ Credentials don't appear in shell history
- ✅ More secure than command-line arguments

### Command-Line Arguments

```bash
cptrash -u https://example.com:2083 -n myuser -p 'mypass'
```

> **⚠️ Note:** If your password contains special characters (`;`, `&`, `!`, `|`, etc.), wrap it in single quotes.

## 📖 Usage

### Basic Usage

```bash
# Interactive mode - prompts for missing credentials
cptrash

# With partial arguments - prompts for missing values
cptrash -u https://example.com:2083

# Dry run - preview what would be deleted
cptrash --dry-run

# Or use the short flag
cptrash -d
```

### Advanced Usage

```bash
# Run in headless mode (no browser window)
cptrash --headless

# Use specific browser executable
cptrash -b "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"

# Increase timeout for slow connections (default: 30000ms)
cptrash -t 60000

# Combine multiple options
cptrash -u https://example.com:2083 -n myuser -H -d
```

### Environment Variables

You can also set credentials via environment variables:

```bash
export CPANEL_URL="https://example.com:2083"
export CPANEL_USERNAME="myuser"
export CPANEL_PASSWORD="mypass"
export HEADLESS="true"
export TIMEOUT="60000"
export BROWSER_PATH="/path/to/browser"

cptrash
```

## 📋 Command Options

| Flag                | Alias | Description                                   | Default            |
| ------------------- | ----- | --------------------------------------------- | ------------------ |
| `--url <url>`       | `-u`  | cPanel URL (e.g., `https://example.com:2083`) | Interactive prompt |
| `--username <user>` | `-n`  | cPanel username                               | Interactive prompt |
| `--password <pass>` | `-p`  | cPanel password                               | Interactive prompt |
| `--dry-run`         | `-d`  | Preview without deleting                      | `false`            |
| `--headless`        | `-H`  | Run browser in headless mode                  | `false`            |
| `--timeout <ms>`    | `-t`  | Timeout in milliseconds                       | `30000`            |
| `--browser <path>`  | `-b`  | Custom browser executable path                | Auto-detect        |
| `--version`         | `-V`  | Show version number                           | -                  |
| `--help`            | `-h`  | Show help message                             | -                  |

## 🌐 Supported Browsers

The tool automatically detects and supports the following Chromium-based browsers:

### macOS

- Google Chrome
- Brave Browser
- Microsoft Edge
- Chromium
- Arc
- Opera
- Vivaldi

### Windows

- Google Chrome
- Brave Browser
- Microsoft Edge

### Linux

- Google Chrome
- Chromium
- Brave Browser
- Microsoft Edge

If multiple browsers are detected, you'll be prompted to select one. You can also specify a custom browser path using the `--browser` flag.

## 💻 Requirements

- **Node.js** >= 18.0.0
- **Chromium-based browser** installed on your system
- **cPanel access** with File Manager permissions

## 🔧 How It Works

1. **Authentication** - Prompts for missing credentials or uses provided CLI arguments
2. **Browser Detection** - Auto-detects installed browsers or uses the specified browser
3. **Login** - Authenticates with cPanel using your credentials
4. **Navigation** - Navigates to the File Manager trash directory (`~/.trash`)
5. **Recursive Scan** - Recursively scans all folders and subfolders
6. **Depth-First Deletion** - Deletes files from the deepest level up
7. **Folder Cleanup** - Removes empty folders after their contents are deleted
8. **Progress Tracking** - Shows live progress with folder count and item statistics
9. **Summary Report** - Displays a formatted table with all processed folders and their status

## 📊 Output Example

```
                _               _
   ___ _ __ | |_ _ __ __ _ ___| |__
  / __| '_ \| __| '__/ _` / __| '_ \
 | (__| |_) | |_| | | (_| \__ \ | | |
  \___| .__/ \__|_|  \__,_|___/_| |_|
      |_|

  cPanel File Manager Trash Cleanup

⠋ Scanning ~/.trash/garments.1/.git/objects | 12 folders | 45 items

  PATH                                    ITEMS   STATUS
  ──────────────────────────────────────  ─────── ────────
  ~/.trash/garments.1/.git/objects/33        2      ✓ done
  ~/.trash/garments.1/.git/objects/34        4      ✓ done
  ~/.trash/garments.1/.git/objects/35        0      - empty

✅ Cleanup Complete!

   📁 Folders scanned: 12
   🗑️  Items deleted: 210
   ⏱️  Time taken: 15.2s
```

## 🔒 Security

- **Masked Password Input** - Interactive password input shows `*` instead of characters
- **Local Only** - Credentials are only used locally to authenticate with your cPanel
- **No External Transmission** - Credentials are never transmitted anywhere except to your cPanel server
- **Shell History Safe** - Using interactive mode keeps passwords out of shell history
- **Headless Mode** - Consider using `--headless` mode in production/automated environments

## 🐛 Troubleshooting

### Browser Not Found

If the tool can't find a browser:

1. Make sure a Chromium-based browser is installed
2. Use the `--browser` flag to specify the browser path manually:
   ```bash
   cptrash -b "/path/to/browser"
   ```

### Connection Timeout

If you experience timeouts on slow connections:

```bash
# Increase timeout (in milliseconds)
cptrash -t 60000
```

### Login Failures

- Verify your cPanel URL includes the port (usually `:2083` for HTTP or `:2087` for HTTPS)
- Check that your credentials are correct
- Ensure your cPanel account has File Manager access

### Items Not Deleting

- The tool uses depth-first deletion - folders are only deleted after their contents
- If deletion fails, the tool will retry automatically
- Check the summary table for any failed deletions

### Headless Mode Issues

If you encounter issues in headless mode, try running without it:

```bash
cptrash  # Runs with visible browser window
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Pranesh P**

- GitHub: [@itsprane](https://github.com/itsprane)
- Email: pranesh.vimal5@gmail.com

## 🙏 Acknowledgments

- Built with [Puppeteer](https://pptr.dev/) for browser automation
- Uses [Puppeteer Extra Stealth Plugin](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) for bot detection bypass
- CLI powered by [Commander.js](https://github.com/tj/commander.js)
- Beautiful output with [Chalk](https://github.com/chalk/chalk), [Ora](https://github.com/sindresorhus/ora), and [Boxen](https://github.com/sindresorhus/boxen)

---

⭐ If you find this project useful, please consider giving it a star on GitHub!
