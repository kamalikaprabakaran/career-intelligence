from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()

    def on_console(msg):
        if msg.type == 'error':
            print(f"CONSOLE ERROR: {msg.text}")

    page.on("console", on_console)
    page.on("pageerror", lambda err: print(f"UNCAUGHT ERROR: {err}"))

    # Set mock user ID
    page.goto('http://127.0.0.1:5500/index.html')
    page.evaluate("localStorage.setItem('selectedUserId', '12345678')")

    # Navigate and check!
    page.goto('http://127.0.0.1:5500/profile.html')
    page.wait_for_timeout(1000)
    
    print("--- DIAGNOSTIC RESULTS ---")
    
    num_inputs = page.evaluate('document.querySelectorAll("input[type=\\"file\\"]").length')
    print(f"STEP 1: document.querySelectorAll('input[type=\"file\"]').length = {num_inputs}")

    if num_inputs > 0:
        click_success = page.evaluate('''() => {
            let clicked = false;
            const inp = document.querySelector('input[type="file"]');
            inp.addEventListener('click', () => { clicked = true; });
            inp.click();
            return clicked;
        }''')
        print(f"STEP 2: input.click() executed natively? {click_success}")

        # Check if the click listener is bound on drop zone
        bound_handlers = page.evaluate('''() => {
            const dropZone = document.getElementById('drop-zone');
            return dropZone !== null;
        }''')
        print(f"STEP 2.5: Drop zone exists? {bound_handlers}")
    
    print(f"STEP 4: Duplicate file inputs? {num_inputs}")

    browser.close()
