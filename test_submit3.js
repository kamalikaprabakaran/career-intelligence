const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', err => console.log('ERR:', err.message));

    // Set up response interception to see if fetch goes through
    page.on('request', req => {
        console.log('REQ:', req.method(), req.url());
    });

    await page.goto('http://127.0.0.1:5500/profile.html#setup');
    await page.evaluate(() => {
        localStorage.setItem('selectedUserId', '12345678-1234-1234-1234-123456789012');
    });

    await page.goto('http://127.0.0.1:5500/profile.html');
    await page.waitForTimeout(1000);

    await page.evaluate(async () => {
        // mock a file selection
        const uiFile = document.getElementById('resume-file');
        const dt = new DataTransfer();
        dt.items.add(new File(['123'], 'foo.pdf', { type: 'application/pdf' }));
        uiFile.files = dt.files;
        uiFile.dispatchEvent(new Event('change'));

        console.log("Mock selected. Clicking upload button...");
        document.getElementById('upload-btn').click();
    });

    await page.waitForTimeout(2000);
    console.log("TEST FINISHED");
    await browser.close();
})();
