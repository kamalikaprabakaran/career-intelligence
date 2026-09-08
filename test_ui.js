const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Route console logs
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`[PAGE ERROR]: ${msg.text()}`);
        }
    });
    page.on('pageerror', err => {
        console.log(`[PAGE UNCAUGHT ERROR]: ${err.message}`);
    });

    // Inject a mock user ID
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.evaluate(() => {
        localStorage.setItem('selectedUserId', '12345678');
    });

    await page.goto('http://127.0.0.1:5500/profile.html');
    await page.waitForTimeout(1000);

    console.log('--- DIAGNOSTIC RESULTS ---');

    // Step 1
    const numInputs = await page.evaluate(() => document.querySelectorAll('input[type="file"]').length);
    console.log(`STEP 1: document.querySelectorAll('input[type="file"]').length = ${numInputs}`);

    if (numInputs > 0) {
        // Step 2
        const clickSuccess = await page.evaluate(() => {
            let clicked = false;
            const inp = document.querySelector('input[type="file"]');
            inp.addEventListener('click', () => { clicked = true; });
            inp.click();
            return clicked;
        });
        console.log(`STEP 2: input.click() executed natively? ${clickSuccess}`);

        const boundHandlers = await page.evaluate(() => {
            const dropZone = document.getElementById('drop-zone');
            // In Playwright, we can't easily see internal event listeners, but we can verify our fix is in the DOM
            return dropZone !== null;
        });
        console.log(`STEP 2.5: Drop zone exists? ${boundHandlers}`);
    }

    // Step 3 (covered by pageerror listener)

    // Step 4
    console.log(`STEP 4: Duplicate file inputs? ${numInputs === 1 ? 'No, exactly 1' : `Yes, found ${numInputs}`}`);

    await browser.close();
})();
