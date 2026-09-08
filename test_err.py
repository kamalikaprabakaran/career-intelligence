import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # We MUST catch all errors
        page.on("console", lambda msg: print(f"CONSOLE {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        await page.goto("http://127.0.0.1:5500/profile.html")
        await page.wait_for_timeout(2000)
        
        # Check if the event listener is effectively bound by dispatching a click manually
        try:
            print("Dispatching click...")
            await page.evaluate('''() => {
                const btn = document.getElementById("upload-btn");
                if (!btn) console.error("upload-btn missing in DOM!");
                btn.click();
            }''')
            await page.wait_for_timeout(1000)
            url = page.url
            print(f"URL AFTER CLICK: {url}")
        except Exception as e:
            print("EVAL ERROR:", e)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
