const { test, expect } = require('@playwright/test');

test('basic user flow', async ({ page }) => {
    // 1. Open Homepage
    await page.goto('/');

    // 2. Check for Join Room elements
    await expect(page.getByPlaceholder('Enter Room ID')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join Session' })).toBeDisabled();

    // 3. Enter Room ID
    await page.getByPlaceholder('Enter Room ID').fill('e2e-test-room');
    await expect(page.getByRole('button', { name: 'Join Session' })).toBeEnabled();

    // 4. Click Join
    await page.getByRole('button', { name: 'Join Session' }).click();

    // 5. Verify URL changes (assuming redirection logic works)
    await expect(page).toHaveURL(/\/\?room=e2e-test-room/);

    // Note: Since we are not actually running a full specialized backend with avatars in this mock env, we stop here.
    // Real E2E would verify the avatar appearance if the backend sent the events correctly.
});
