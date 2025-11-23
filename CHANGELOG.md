# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-23

### Added

- Initial release of cptrash CLI tool
- Recursive deletion of cPanel File Manager trash contents
- Interactive credential prompts with masked password input
- Auto-detection of installed Chromium-based browsers
- Browser selection when multiple browsers are available
- Dry-run mode to preview deletions without actually deleting
- Headless mode support for automated environments
- Custom browser path option
- Configurable timeout for slow connections
- Live progress bar with folder and item statistics
- Summary table showing all processed folders with status
- Stealth mode using Puppeteer Stealth plugin to bypass bot detection
- Robust error handling with retry logic
- Depth-first deletion algorithm for safe folder removal
- Support for macOS, Windows, and Linux
- Beautiful CLI output with colors and formatted tables
- Environment variable support for configuration
- Comprehensive README with usage examples

### Features

- **Recursive Deletion**: Automatically scans and deletes all files and folders in cPanel's trash
- **Progress Tracking**: Real-time progress display with live updates
- **Summary Reports**: Clean tabular summary of all operations
- **Security**: Masked password input, no credentials in shell history
- **Cross-Platform**: Works on macOS, Windows, and Linux
- **Browser Support**: Auto-detects Chrome, Brave, Edge, Chromium, Arc, Opera, Vivaldi

---

## [Unreleased]

### Planned

- Add support for custom trash paths
- Add verbose logging option
- Add JSON output format option
- Add configuration file support
- Add batch processing for multiple cPanel accounts

---

## Release Notes

### Version 1.0.0

This is the initial release of cptrash. The tool provides a command-line interface for cleaning up cPanel File Manager trash directories recursively. It uses Puppeteer for browser automation and includes features like dry-run mode, progress tracking, and comprehensive error handling.

**Requirements:**

- Node.js >= 18.0.0
- A Chromium-based browser installed on your system
- cPanel access with File Manager permissions

**Installation:**

```bash
npm install -g cptrash
```

**Quick Start:**

```bash
cptrash
```

---

[1.0.0]: https://github.com/itsprane/cptrash/releases/tag/v1.0.0
