import { test, expect } from '@playwright/test';

test.describe('Image Upload Flow', () => {
  test('Uploads image, caches URL, and displays with Finnish toast', async ({ page }) => {
    page.on('console', msg => console.log('Browser console:', msg.text())); // Log browser console messages
    await page.goto('/login');
    await page.screenshot({ path: 'test-results/login-page.png' }); // Take screenshot before fill
    await page.fill('input[name="email"]', 'test@repur.fi');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Kirjaudu sisään")');
    await expect(page).toHaveURL(/dashboard/);

    await page.goto('/admin/listings/YL9p9ktl3eS49-CisbNlk');

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('input[type="file"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/test-image.jpg');

    await expect(page.getByText('Kuva ladattu onnistuneesti')).toBeVisible({ timeout: 10000 });

    const img = page.locator('img[alt*="Listauskuva"]');
    await expect(img).toBeVisible();
    const src = await img.getAttribute('src');
    expect(src).toMatch(/wukkulrwjqqxcxiwnflc\.supabase\.co\/storage\/v1\/object\/public\/images/);

    await page.click('button:has-text("Tallenna")');
    await expect(page.getByText('Listaus päivitetty onnistuneesti')).toBeVisible();
  });

  test('Rejects invalid file with Finnish error toast', async ({ page }) => {
    page.on('console', msg => console.log('Browser console:', msg.text())); // Log browser console messages
    await page.goto('/login');
    await page.screenshot({ path: 'test-results/login-page-invalid.png' }); // Take screenshot before fill
    await page.fill('input[name="email"]', 'test@repur.fi');
    await page.fill('input[name="password"]', 'password');
    await page.click('button:has-text("Kirjaudu sisään")');
    await expect(page).toHaveURL(/dashboard/);

    await page.goto('/admin/listings/YL9p9ktl3eS49-CisbNlk');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('input[type="file"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('tests/fixtures/invalid.gif');

    await expect(page.getByText(/Kuva on liian suuri|ei ole JPG\/PNG-muodossa/)).toBeVisible();
    await expect(page.locator('img')).toHaveCount(0);
  });
});
