#!/usr/bin/env node

/**
 * HiBob Timesheet Submission Automation
 *
 * Automates the monthly timesheet submission process in HiBob:
 * 1. Logs into HiBob
 * 2. Clicks "Review and submit" if there's a pending timesheet
 * 3. Applies "Quick fix" to auto-fill missing entries
 * 4. Submits the timesheet
 *
 * Usage:
 *   node hibob-timesheet-submission.js
 *
 * Environment variables:
 *   HIBOB_EMAIL    - Your HiBob login email
 *   HIBOB_PASSWORD - Your HiBob password
 */

require('dotenv').config({ quiet: true });
const { chromium } = require('playwright');

const ATTENDANCE_URL = 'https://app.hibob.com/attendance/my-attendance';

async function submitTimesheet() {
  const email = process.env.HIBOB_EMAIL;
  const password = process.env.HIBOB_PASSWORD;

  if (!email || !password) {
    console.error('Missing HIBOB_EMAIL or HIBOB_PASSWORD environment variables');
    console.error('Create a .env file with these values or export them in your shell');
    process.exit(1);
  }

  console.log('Starting HiBob timesheet submission...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to attendance page
    console.log('1. Navigating to HiBob...');
    await page.goto(ATTENDANCE_URL, { waitUntil: 'networkidle' });

    // Login if needed
    if (page.url().includes('login')) {
      console.log('2. Logging in...');

      await page.fill('input[type="email"], input[name="email"], input[id*="email"]', email);
      await page.click('button[type="submit"], button:has-text("Continue"), button:has-text("Next")');

      await page.waitForSelector('input[type="password"]:visible', { timeout: 10000 });
      await page.fill('input[type="password"]:visible', password);
      await page.click('button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")');

      console.log('   Waiting for attendance page...');
      await page.waitForURL('**/attendance/my-attendance**', { timeout: 30000 });
      await page.waitForTimeout(3000);
      console.log('   Logged in successfully.');
    }

    // Click "Review and submit" in banner if present
    console.log('3. Looking for "Review and submit" button...');
    const reviewButton = page.locator('button:has-text("Review and submit")');

    if (await reviewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reviewButton.click();
      console.log('   Clicked "Review and submit".');
      await page.waitForTimeout(2000);
    } else {
      console.log('   No pending timesheet to review.');
    }

    // Scroll down and apply Quick Fix if available
    console.log('4. Looking for "Quick fix" button...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const quickFixButton = page.locator('button:has-text("Quick fix")');

    try {
      await quickFixButton.scrollIntoViewIfNeeded({ timeout: 5000 });
      await page.waitForTimeout(500);

      if (await quickFixButton.isVisible()) {
        console.log('5. Clicking "Quick fix" button...');
        await quickFixButton.click();
        console.log('   Clicked "Quick fix".');
        await page.waitForTimeout(2000);

        console.log('6. Saving quick fix...');
        const saveButton = page.locator('button:has-text("Save")');
        await saveButton.waitFor({ state: 'visible', timeout: 5000 });
        await saveButton.click();
        console.log('   Saved.');
        await page.waitForTimeout(2000);

        const successToast = page.locator('text=Entries updated');
        if (await successToast.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('   Entries updated successfully.');
        }
      } else {
        console.log('   Quick fix not needed.');
      }
    } catch (e) {
      console.log('   Quick fix not available:', e.message);
    }

    // Submit the timesheet
    console.log('7. Looking for "Submit" button...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const submitButton = page.locator('button:has-text("Submit")').first();

    try {
      await submitButton.waitFor({ state: 'visible', timeout: 5000 });
      const isDisabled = await submitButton.isDisabled();

      if (!isDisabled) {
        await submitButton.click();
        console.log('   Clicked "Submit".');

        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
          console.log('   Confirmed submission.');
        }

        await page.waitForTimeout(2000);
        const submitted = page.locator('text=Timesheet submitted');
        if (await submitted.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('\nTimesheet submitted successfully!');
        } else {
          console.log('\nSubmit clicked, but could not confirm success.');
        }
      } else {
        console.log('   Submit button is disabled (timesheet may already be submitted).');
      }
    } catch (e) {
      console.log('   Submit button issue:', e.message);
    }

  } catch (error) {
    console.error('\nError:', error.message);
    const screenshotPath = `/tmp/hibob-error-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved: ${screenshotPath}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

submitTimesheet().catch(console.error);
