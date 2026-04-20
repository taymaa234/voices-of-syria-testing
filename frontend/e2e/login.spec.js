/**
 * E2E Test: Login Flow
 * Tool: Playwright
 *
 * Prerequisites:
 *   - Frontend running on http://localhost:3000
 *   - Backend running on http://localhost:8080
 *   - A verified user exists in the database
 *
 * Run: npx playwright test e2e/login.spec.js
 */

const { test, expect } = require('@playwright/test');

// Test credentials - use a real verified user in your DB
const TEST_EMAIL = 'user@voicesofsyria.com';
const TEST_PASSWORD = 'User123!';

test.describe('Login Flow', () => {

  /**
   * Normal Case: تسجيل دخول ناجح
   * السيناريو: مستخدم يفتح صفحة login، يدخل بياناته الصحيحة، يضغط Log In
   * المتوقع: يتم توجيهه لـ /dashboard
   */
  test('successful login redirects to dashboard', async ({ page }) => {
    // 1. فتح صفحة تسجيل الدخول
    await page.goto('http://localhost:3000/login');

    // 2. التحقق إن الصفحة حُملت
    await expect(page).toHaveTitle(/Voices of Syria/i);

    // 3. ملء حقل البريد الإلكتروني
    await page.fill('input[type="email"]', TEST_EMAIL);

    // 4. ملء حقل كلمة المرور
    await page.fill('input[type="password"]', TEST_PASSWORD);

    // 5. الضغط على زر تسجيل الدخول
    await page.click('button[type="submit"]');

    // 6. انتظار التوجيه لـ /dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // 7. التحقق إن URL تغير لـ /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  /**
   * Error Case: بيانات خاطئة
   * السيناريو: مستخدم يدخل password غلط
   * المتوقع: تظهر رسالة خطأ، ما يصير توجيه
   */
  test('wrong credentials shows error message', async ({ page }) => {
    // 1. فتح صفحة تسجيل الدخول
    await page.goto('http://localhost:3000/login');

    // 2. ملء البيانات الخاطئة
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', 'wrongpassword');

    // 3. الضغط على زر تسجيل الدخول
    await page.click('button[type="submit"]');

    // 4. انتظار ظهور رسالة الخطأ
    await page.waitForTimeout(2000);

    // 5. التحقق إن رسالة خطأ ظهرت
    const errorVisible = await page.locator('[class*="errorMessage"]').isVisible();
    expect(errorVisible).toBeTruthy();

    // 6. التحقق إن المستخدم لم يتم توجيهه
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * Edge Case: حقول فارغة
   * السيناريو: مستخدم يضغط Log In بدون ما يملأ أي حقل
   * المتوقع: يبقى في صفحة login
   */
  test('empty fields prevents login', async ({ page }) => {
    // 1. فتح صفحة تسجيل الدخول
    await page.goto('http://localhost:3000/login');

    // 2. الضغط على زر تسجيل الدخول بدون ملء الحقول
    await page.click('button[type="submit"]');

    // 3. التحقق إن المستخدم لم يتم توجيهه
    await expect(page).toHaveURL(/\/login/);
  });

});
