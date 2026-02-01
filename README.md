# HiBob Timesheet Submission

Automate your monthly HiBob timesheet submission with a single command.

## The Problem

Every month, HiBob requires you to:
1. Navigate to the attendance page
2. Click "Review and submit"
3. Scroll down and click "Quick fix" to auto-fill entries
4. Click "Save"
5. Scroll back up and click "Submit"

This script does all of that automatically.

## Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/hibob-timesheet-submission.git
cd hibob-timesheet-submission

# Install dependencies
npm install

# Install Playwright browser (first time only)
npx playwright install chromium

# Create your .env file
cp .env.example .env
# Edit .env with your HiBob credentials
```

## Usage

### Run manually

```bash
node hibob-timesheet-submission.js
```

### Schedule with cron (recommended)

Run automatically at 2am on the 1st of each month:

```bash
crontab -e

# Add this line (adjust paths as needed):
0 2 1 * * cd /path/to/hibob-timesheet-submission && /usr/bin/node hibob-timesheet-submission.js >> hibob.log 2>&1
```

**Note:** If your computer is asleep, the job runs when you wake it.

## How It Works

The script uses [Playwright](https://playwright.dev/) to automate a headless Chromium browser:

1. Navigates to HiBob's attendance page
2. Logs in with your credentials
3. Clicks "Review and submit" if there's a pending timesheet
4. Scrolls down and applies "Quick fix" to auto-fill missing entries
5. Submits the timesheet

## Troubleshooting

- **Login fails**: Double-check credentials in `.env`
- **Quick fix not found**: HiBob's UI may have changed; check error screenshots in `/tmp/`
- **Submit disabled**: Quick fix may not have applied correctly

## License

MIT
