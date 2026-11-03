"""
Cloudflare Web Performance Audit Script (web-perf)
Performs automated Core Web Vitals, Network waterfall, Resource breakdown,
and SPA Route integrity checks on GitToScale.
"""

import json
import os
import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("TARGET_URL", "http://localhost:5173")
REPORT_PATH = "/home/my/Desktop/gitoscale/perf-audit-report.json"
OUTPUT_DIR = "/home/my/Desktop/gitoscale/perf-results"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def audit():
    print(f"[Audit] Starting Cloudflare Web Performance Audit for: {BASE_URL}")
    report = {
        "target": BASE_URL,
        "timestamp": time.time(),
        "core_web_vitals": {},
        "network_analysis": {},
        "render_blocking": [],
        "route_checks": {},
        "accessibility_summary": {},
        "recommendations": []
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate standard desktop viewport and 4G / typical broadband conditions
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 GitToScale-PerfAuditor/1.0"
        )
        page = context.new_page()

        # Track network requests
        network_requests = []
        page.on("request", lambda req: network_requests.append({
            "url": req.url,
            "resource_type": req.resource_type,
            "method": req.method,
            "headers": req.headers,
            "start_time": time.time()
        }))

        responses = []
        def handle_response(res):
            try:
                responses.append({
                    "url": res.url,
                    "status": res.status,
                    "content_type": res.headers.get("content-type", ""),
                    "content_length": int(res.headers.get("content-length", 0)) if res.headers.get("content-length") else 0,
                    "cache_control": res.headers.get("cache-control", ""),
                    "content_encoding": res.headers.get("content-encoding", "none")
                })
            except Exception:
                pass
        page.on("response", handle_response)

        # Connect CDP session for advanced performance tracing
        cdp = context.new_cdp_session(page)
        cdp.send("Performance.enable")
        cdp.send("Network.enable")

        # -------------------------------------------------------------
        # PHASE 1 & 2: Core Web Vitals on Landing Page
        # -------------------------------------------------------------
        print("\n--- PHASE 1 & 2: Landing Page Performance & CWV ---")
        
        # Inject Web Vitals observer scripts before navigation
        init_script = """
        window.__perf_metrics = {
            fcp: 0,
            lcp: 0,
            lcp_element: '',
            cls: 0,
            cls_entries: [],
            long_tasks_count: 0,
            total_blocking_time: 0
        };

        // Observe FCP
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    window.__perf_metrics.fcp = entry.startTime;
                }
            }
        }).observe({ type: 'paint', buffered: true });

        // Observe LCP
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                window.__perf_metrics.lcp = lastEntry.startTime;
                window.__perf_metrics.lcp_element = lastEntry.element ? (lastEntry.element.tagName + (lastEntry.element.id ? '#' + lastEntry.element.id : '') + (lastEntry.element.className ? '.' + lastEntry.element.className.toString().split(' ')[0] : '')) : '';
            }
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // Observe CLS
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                    window.__perf_metrics.cls += entry.value;
                    window.__perf_metrics.cls_entries.push({
                        value: entry.value,
                        time: entry.startTime
                    });
                }
            }
        }).observe({ type: 'layout-shift', buffered: true });

        // Observe Long Tasks for TBT
        new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                window.__perf_metrics.long_tasks_count++;
                if (entry.duration > 50) {
                    window.__perf_metrics.total_blocking_time += (entry.duration - 50);
                }
            }
        }).observe({ type: 'longtask', buffered: true });
        """
        page.add_init_script(init_script)

        t0 = time.time()
        nav_response = page.goto(f"{BASE_URL}/", wait_until="networkidle")
        nav_time_ms = (time.time() - t0) * 1000

        page.wait_for_timeout(2000)  # Allow final shifts and LCP consolidation
        page.screenshot(path=os.path.join(OUTPUT_DIR, "audit_landing_page.png"), full_page=True)

        # Retrieve browser Navigation Timing metrics
        nav_timing = page.evaluate("""() => {
            const nav = performance.getEntriesByType('navigation')[0];
            if (!nav) return null;
            return {
                ttfb: nav.responseStart - nav.requestStart,
                dns: nav.domainLookupEnd - nav.domainLookupStart,
                tcp: nav.connectEnd - nav.connectStart,
                request_duration: nav.responseEnd - nav.responseStart,
                dom_interactive: nav.domInteractive - nav.startTime,
                dom_content_loaded: nav.domContentLoadedEventEnd - nav.startTime,
                load_event: nav.loadEventEnd - nav.startTime,
                transfer_size: nav.transferSize,
                encoded_body_size: nav.encodedBodySize,
                decoded_body_size: nav.decodedBodySize
            };
        }""")

        perf_metrics = page.evaluate("() => window.__perf_metrics")
        cdp_metrics = cdp.send("Performance.getMetrics")
        cdp_dict = {m["name"]: m["value"] for m in cdp_metrics["metrics"]}

        ttfb = nav_timing.get("ttfb", 0) if nav_timing else 0
        fcp = perf_metrics.get("fcp", 0)
        lcp = perf_metrics.get("lcp", 0)
        cls = perf_metrics.get("cls", 0)
        tbt = perf_metrics.get("total_blocking_time", 0)

        # Threshold evaluators according to web.dev & Cloudflare web-perf specifications:
        # LCP: < 2500ms (good), < 4000ms (needs-improvement), >= 4000ms (poor)
        # FCP: < 1800ms (good), < 3000ms (needs-improvement), >= 3000ms (poor)
        # CLS: < 0.1 (good), < 0.25 (needs-improvement), >= 0.25 (poor)
        # TBT: < 200ms (good), < 600ms (needs-improvement), >= 600ms (poor)
        # TTFB: < 800ms (good), < 1800ms (needs-improvement), >= 1800ms (poor)

        def rate_metric(val, good_th, poor_th):
            if val <= good_th:
                return "GOOD"
            elif val <= poor_th:
                return "NEEDS IMPROVEMENT"
            return "POOR"

        report["core_web_vitals"] = {
            "TTFB": {
                "value_ms": round(ttfb, 2),
                "threshold_good_ms": 800,
                "rating": rate_metric(ttfb, 800, 1800)
            },
            "FCP": {
                "value_ms": round(fcp, 2),
                "threshold_good_ms": 1800,
                "rating": rate_metric(fcp, 1800, 3000)
            },
            "LCP": {
                "value_ms": round(lcp, 2),
                "threshold_good_ms": 2500,
                "rating": rate_metric(lcp, 2500, 4000),
                "element": perf_metrics.get("lcp_element", "hero-or-heading")
            },
            "CLS": {
                "value": round(cls, 4),
                "threshold_good": 0.1,
                "rating": rate_metric(cls, 0.1, 0.25)
            },
            "TBT": {
                "value_ms": round(tbt, 2),
                "threshold_good_ms": 200,
                "rating": rate_metric(tbt, 200, 600)
            },
            "DOM_Content_Loaded_ms": round(nav_timing.get("dom_content_loaded", 0), 2) if nav_timing else 0,
            "Page_Load_Event_ms": round(nav_timing.get("load_event", 0), 2) if nav_timing else 0
        }

        print(f"  TTFB: {ttfb:.2f}ms [{report['core_web_vitals']['TTFB']['rating']}]")
        print(f"  FCP:  {fcp:.2f}ms [{report['core_web_vitals']['FCP']['rating']}]")
        print(f"  LCP:  {lcp:.2f}ms [{report['core_web_vitals']['LCP']['rating']}] (Element: {report['core_web_vitals']['LCP']['element']})")
        print(f"  CLS:  {cls:.4f} [{report['core_web_vitals']['CLS']['rating']}]")
        print(f"  TBT:  {tbt:.2f}ms [{report['core_web_vitals']['TBT']['rating']}]")

        # -------------------------------------------------------------
        # PHASE 3: Network Waterfall & Resource Inventory
        # -------------------------------------------------------------
        print("\n--- PHASE 3: Network Analysis & Resource Inventory ---")
        
        resource_stats = {}
        total_transfer_bytes = 0
        for res in responses:
            ctype = res["content_type"].split(";")[0].strip() or "other"
            size = res["content_length"]
            total_transfer_bytes += size
            
            # Categorize
            category = "other"
            if "javascript" in ctype or res["url"].endswith(".js"):
                category = "script"
            elif "css" in ctype or res["url"].endswith(".css"):
                category = "stylesheet"
            elif "image" in ctype or any(res["url"].endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".svg", ".webp", ".ico"]):
                category = "image"
            elif "font" in ctype or any(res["url"].endswith(ext) for ext in [".woff", ".woff2", ".ttf"]):
                category = "font"
            elif "html" in ctype:
                category = "document"

            if category not in resource_stats:
                resource_stats[category] = {"count": 0, "bytes": 0, "items": []}
            resource_stats[category]["count"] += 1
            resource_stats[category]["bytes"] += size
            if len(resource_stats[category]["items"]) < 10:
                resource_stats[category]["items"].append({
                    "url": res["url"].split("?")[0],
                    "size_bytes": size,
                    "cache_control": res["cache_control"],
                    "compression": res["content_encoding"]
                })

        report["network_analysis"] = {
            "total_requests": len(responses),
            "total_transfer_bytes": total_transfer_bytes,
            "total_transfer_kb": round(total_transfer_bytes / 1024, 2),
            "resource_breakdown": resource_stats,
            "cdp_js_heap_used_mb": round(cdp_dict.get("JSHeapUsedSize", 0) / (1024 * 1024), 2),
            "cdp_nodes_count": cdp_dict.get("Nodes", 0)
        }

        print(f"  Total Requests: {len(responses)}")
        print(f"  Total Transfer: {round(total_transfer_bytes / 1024, 2)} KB")
        for cat, data in resource_stats.items():
            print(f"    - {cat.capitalize()}: {data['count']} files ({round(data['bytes'] / 1024, 2)} KB)")

        # Check for Render-Blocking Resources in Head
        render_blocking = page.evaluate("""() => {
            const blocking = [];
            const scripts = document.querySelectorAll('head > script:not([async]):not([defer]):not([type="module"])');
            scripts.forEach(s => {
                if (s.src) blocking.push({ type: 'script', url: s.src });
            });
            const links = document.querySelectorAll('head > link[rel="stylesheet"]:not([media="print"])');
            links.forEach(l => {
                if (l.href) blocking.push({ type: 'stylesheet', url: l.href });
            });
            return blocking;
        }""")
        report["render_blocking"] = render_blocking
        print(f"  Render-blocking elements in head: {len(render_blocking)}")

        # -------------------------------------------------------------
        # PHASE 4: Accessibility Snapshot
        # -------------------------------------------------------------
        print("\n--- PHASE 4: Accessibility & SEO Verification ---")
        a11y_data = page.evaluate("""() => {
            return {
                title: document.title,
                has_h1: document.querySelectorAll('h1').length > 0,
                h1_count: document.querySelectorAll('h1').length,
                has_meta_viewport: !!document.querySelector('meta[name="viewport"]'),
                has_html_lang: !!document.documentElement.lang,
                html_lang: document.documentElement.lang || 'missing',
                images_without_alt: Array.from(document.querySelectorAll('img:not([alt])')).length,
                aria_buttons_missing_name: Array.from(document.querySelectorAll('button:empty:not([aria-label]):not([aria-labelledby])')).length
            };
        }""")
        report["accessibility_summary"] = a11y_data
        print(f"  Document Title: {a11y_data['title']}")
        print(f"  H1 Count: {a11y_data['h1_count']}")
        print(f"  HTML Lang: {a11y_data['html_lang']}")
        print(f"  Images missing alt: {a11y_data['images_without_alt']}")

        # -------------------------------------------------------------
        # PHASE 5: SPA Route Integrity Checks (Addressing the 404 issue)
        # -------------------------------------------------------------
        print("\n--- PHASE 5: SPA Route Integrity & Navigation ---")
        test_routes = [
            ("/", "Landing Page"),
            ("/app", "Application Workspace"),
            ("/product/prj_mvyx7you_wzjiy?prompt=Distributed%20Cache", "Product Deep Link (from user screenshot)"),
            ("/project/prj_testdemo?repo=https://github.com/test/demo", "GitHub Import Project Route")
        ]

        route_results = {}
        for route_path, desc in test_routes:
            url = f"{BASE_URL}{route_path}"
            res = page.goto(url, wait_until="domcontentloaded")
            page.wait_for_timeout(1000)
            status_code = res.status if res else 0
            page_title = page.title()
            body_text = page.inner_text("body")[:300].replace("\n", " ")
            is_404 = (
                status_code == 404 or 
                "404" in page_title or 
                "This page doesn't exist" in body_text or
                "NOT_FOUND" in body_text
            )
            route_results[route_path] = {
                "description": desc,
                "status": status_code,
                "page_title": page_title,
                "is_404": is_404,
                "status_label": "PASS" if not is_404 else "FAIL (404 Not Found)"
            }
            print(f"  Route [{route_path}]: {route_results[route_path]['status_label']} (Status: {status_code})")

        report["route_checks"] = route_results

        # Write final report
        with open(REPORT_PATH, "w") as f:
            json.dump(report, f, indent=2)
        print(f"\n[Audit] Report saved to {REPORT_PATH}")

        browser.close()

if __name__ == "__main__":
    audit()

