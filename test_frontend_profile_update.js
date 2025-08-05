/**
 * Test frontend profile update flow with browser automation
 * This test verifies that the profile update works without logging out the user
 */

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3000';
const TEST_EMAIL = 'customer@test.com';
const TEST_PASSWORD = 'Password123!';

async function testFrontendProfileUpdate() {
  console.log('=== Testing Frontend Profile Update ===\n');
  
  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Enable request interception to monitor API calls
    await page.setRequestInterception(true);
    const requests = [];
    
    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
      request.continue();
    });
    
    page.on('response', async (response) => {
      if (response.url().includes('/auth/profile') && response.request().method() === 'PUT') {
        console.log(`Profile update response: ${response.status()}`);
        if (response.status() !== 200) {
          const text = await response.text();
          console.log('Response body:', text);
        }
      }
    });
    
    // Step 1: Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('✓ Login page loaded');
    
    // Step 2: Login
    console.log('\n2. Logging in...');
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForNavigation({ timeout: 10000 });
    console.log('✓ Login successful, redirected to dashboard');
    
    // Step 3: Navigate to profile page
    console.log('\n3. Navigating to profile page...');
    await page.goto(`${FRONTEND_URL}/profile`);
    await page.waitForSelector('input[name="first_name"]', { timeout: 10000 });
    console.log('✓ Profile page loaded');
    
    // Step 4: Get current values
    console.log('\n4. Getting current profile values...');
    const currentFirstName = await page.$eval('input[name="first_name"]', el => el.value);
    const currentLastName = await page.$eval('input[name="last_name"]', el => el.value);
    console.log(`Current name: ${currentFirstName} ${currentLastName}`);
    
    // Step 5: Update profile
    console.log('\n5. Updating profile...');
    const newFirstName = 'Frontend Updated';
    const newLastName = 'Test Name';
    
    // Clear and update fields
    await page.click('input[name="first_name"]', { clickCount: 3 });
    await page.type('input[name="first_name"]', newFirstName);
    
    await page.click('input[name="last_name"]', { clickCount: 3 });
    await page.type('input[name="last_name"]', newLastName);
    
    console.log(`Updating to: ${newFirstName} ${newLastName}`);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for the update to complete
    await page.waitForTimeout(2000);
    
    // Step 6: Check if still on profile page (not redirected to login)
    console.log('\n6. Checking if user is still logged in...');
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/login')) {
      console.log('❌ User was redirected to login page after profile update');
      return false;
    } else {
      console.log('✓ User remained on profile page');
    }
    
    // Step 7: Verify the update was saved
    console.log('\n7. Verifying profile was updated...');
    await page.reload();
    await page.waitForSelector('input[name="first_name"]', { timeout: 10000 });
    
    const updatedFirstName = await page.$eval('input[name="first_name"]', el => el.value);
    const updatedLastName = await page.$eval('input[name="last_name"]', el => el.value);
    
    console.log(`Profile after reload: ${updatedFirstName} ${updatedLastName}`);
    
    if (updatedFirstName === newFirstName && updatedLastName === newLastName) {
      console.log('✅ Profile update was saved successfully!');
      return true;
    } else {
      console.log('❌ Profile update was not saved');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function main() {
  const success = await testFrontendProfileUpdate();
  process.exit(success ? 0 : 1);
}

main().catch(console.error);
