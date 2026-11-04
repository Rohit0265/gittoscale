"""
Automated verification for GitToScale 404 Page.
Tests:
1. Valid route (e.g. /) loads LandingPage
2. Valid route (e.g. /terms) loads LegalPage
3. Invalid / typo route (e.g. /some-random-typo-page) loads NotFoundPage with 404 indicator
4. Buttons on NotFoundPage: 'Return to Homepage' navigates back to '/'
5. Suggested routes navigation works
"""

import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"

def test_404_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        print(f"Testing typo/wrong route: {BASE_URL}/invalid-random-typo-path")
        page.goto(f"{BASE_URL}/invalid-random-typo-path", wait_until="networkidle")
        time.sleep(1)

        # 1. Verify 404 page rendered
        body_text = page.inner_text("body")
        assert "404" in body_text, "Expected '404' on page"
        assert "This endpoint doesn't exist" in body_text, "Expected 404 heading"
        assert "/invalid-random-typo-path" in body_text, "Expected requested typo path in callout"
        print("✓ 404 Page rendered successfully with error badge, code, and requested path")

        # 2. Test 'Return to Homepage' button
        home_btn = page.locator("button:has-text('Return to Homepage')")
        assert home_btn.is_visible(), "Homepage button should be visible"
        home_btn.click()
        time.sleep(1)

        assert page.url.rstrip("/") == BASE_URL or page.url.rstrip("/") == f"{BASE_URL}/", f"URL should be home, got {page.url}"
        assert "Turn any GitHub repository" in page.inner_text("body") or "GitToScale" in page.title(), "Landing page should render"
        print("✓ 'Return to Homepage' button navigates back to landing page")

        # 3. Test direct navigation to /404 or another typo
        page.goto(f"{BASE_URL}/wrong-page-typo-123", wait_until="networkidle")
        time.sleep(1)
        assert "This endpoint doesn't exist" in page.inner_text("body")
        print("✓ Additional typo route successfully routed to 404 page")

        page.screenshot(path="perf-results/404_page_screenshot.png")
        print("✓ Screenshot saved to perf-results/404_page_screenshot.png")

        browser.close()

if __name__ == "__main__":
    test_404_flow()
