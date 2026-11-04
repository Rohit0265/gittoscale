"""
Test project ownership verification and unverified protection.
"""
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5173"

def test_unverified_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Simulate user A visiting a project
        test_project_id = "prj_secret_other_user_999"

        # Set localStorage as if owned by user_123
        page.goto(BASE_URL, wait_until="networkidle")
        page.evaluate("""([pid]) => {
            localStorage.setItem('gitoscale_project_owner_' + pid, 'user_owner_aaa');
            localStorage.setItem('gitoscale_project_' + pid, 'Confidential Banking Core Architecture');
            localStorage.setItem('gitoscale_project_state_' + pid, JSON.stringify({
                projectId: pid,
                prompt: 'Confidential Banking Core Architecture',
                nodes: [{ id: '1', name: 'Private Core', type: 'service', workerCount: 1, capacityPerSecond: 100, enabled: true }],
                edges: []
            }));
            // Simulate user logged in as user_intruder_bbb
            localStorage.setItem('gitoscale_mock_user', JSON.stringify({
                id: 'user_intruder_bbb',
                email: 'attacker@example.com'
            }));
        }""", [test_project_id])

        # Now navigate to /product/prj_secret_other_user_999 as user_intruder_bbb
        page.goto(f"{BASE_URL}/product/{test_project_id}", wait_until="networkidle")
        time.sleep(1)

        body_text = page.inner_text("body")
        print("Page text snippet:", body_text[:300].replace("\n", " "))

        # It must NOT show the confidential banking core
        assert "Private Core" not in body_text, "Unauthorized project data leaked into DOM!"

        # It MUST show Project Ownership Unverified
        assert "Project Ownership Unverified" in body_text or "Security Verification Required" in body_text, "Expected Unverified project page"
        print("✓ Verified: Intruder account cannot open other user's project and is shown the Unverified Page!")

        page.screenshot(path="perf-results/unverified_page_screenshot.png")
        print("✓ Screenshot saved to perf-results/unverified_page_screenshot.png")

        browser.close()

if __name__ == "__main__":
    test_unverified_flow()
