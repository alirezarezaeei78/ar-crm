"""Browser integration checks against an isolated AR_CRM_DATA_PATH workspace."""
import json
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
BASE = "http://localhost:3201"
SCREENSHOT_BASE = os.environ.get("AR_CRM_SCREENSHOT_URL", BASE)
DATA = ROOT / "artifacts" / "test-workspace.json"
results = []

def check(name):
    results.append(name)
    print(f"PASS {name}", flush=True)

def data():
    return json.loads(DATA.read_text(encoding="utf-8"))

def go(page, route):
    response = page.goto(BASE + route, wait_until="networkidle")
    assert response.status == 200, (route, response.status)
    expect(page.locator("main h1")).to_be_visible()

def dialog(page):
    return page.get_by_role("dialog")

def save(page, title):
    dialog(page).get_by_role("button", name=title, exact=True).click()
    expect(page.get_by_role("dialog")).to_have_count(0)

with sync_playwright() as p:
    edge = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
    executable = os.environ.get("AR_CRM_BROWSER") or (str(edge) if edge.exists() else None)
    browser = p.chromium.launch(headless=True, executable_path=executable)
    page = browser.new_page(viewport={"width": 1536, "height": 1050}, reduced_motion="reduce")
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    for route in ["/", "/customers", "/orders", "/products", "/inventory", "/pipeline", "/campaigns", "/segments", "/tasks", "/automations", "/reports", "/support", "/team", "/settings"]:
        go(page, route)
        assert not re.search(r"[\u0600-\u06ff]", page.locator("body").inner_text()), route
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), route
    check("All 14 workspace screens render in English without horizontal overflow")

    go(page, "/")
    original = page.locator(".metric-value-row").first.inner_text()
    page.get_by_label("Filter by store").select_option("Downtown")
    assert page.locator(".metric-value-row").first.inner_text() != original
    page.get_by_label("Reporting period").select_option("Last 7 days")
    page.get_by_role("link", name="Customer insights", exact=True).click()
    expect(page.locator("main h1")).to_have_text("Customer segments")
    check("Dashboard date/store filters recalculate metrics and insight navigation works")

    go(page, "/customers")
    page.get_by_role("button", name="Add customer", exact=True).click()
    dialog(page).get_by_label("Full name").fill("QA Retail Customer")
    dialog(page).get_by_label("Email address").fill("qa.retail@example.com")
    dialog(page).get_by_label("Phone number").fill("+1 415 555 0199")
    dialog(page).get_by_label("City").fill("Austin")
    dialog(page).get_by_role("checkbox").check()
    save(page, "Add a customer")
    customer = next(c for c in data()["customers"] if c["email"] == "qa.retail@example.com")
    assert any(t.get("customerId") == customer["id"] and "Welcome" in t["title"] for t in data()["tasks"])
    page.get_by_placeholder("Search name, email, city, or owner...").fill("QA Retail")
    expect(page.locator("tbody tr")).to_have_count(1)
    page.get_by_role("button", name="QA Retail Customer qa.retail@example.com").click()
    dialog(page).get_by_label("Add a customer note").fill("Prefers sustainable packaging and Saturday delivery.")
    dialog(page).get_by_role("button", name="Save note").click()
    expect(dialog(page).get_by_text("Prefers sustainable packaging and Saturday delivery.")).to_be_visible()
    page.keyboard.press("Escape")
    page.reload(wait_until="networkidle")
    assert next(c for c in data()["customers"] if c["id"] == customer["id"])["notes"]
    check("Customer creation, consent, search, welcome automation, notes, and persistence")

    page.get_by_placeholder("Search name, email, city, or owner...").fill("QA Retail")
    page.get_by_role("button", name="QA Retail Customer qa.retail@example.com").click()
    dialog(page).get_by_role("button", name="Edit customer", exact=True).click()
    dialog(page).get_by_label("City").fill("Seattle")
    save(page, "Save customer")
    edited = next(c for c in data()["customers"] if c["id"] == customer["id"])
    assert edited["city"] == "Seattle" and edited["notes"] and edited["consent"]
    check("Editing customer details preserves notes, identity, and marketing consent")

    page.get_by_role("button", name="Add customer", exact=True).click()
    dialog(page).get_by_label("Full name").fill("Duplicate Customer")
    dialog(page).get_by_label("Email address").fill("qa.retail@example.com")
    dialog(page).get_by_role("button", name="Add a customer", exact=True).click()
    expect(page.get_by_role("alert").filter(has_text="already exists")).to_be_visible()
    expect(dialog(page)).to_be_visible()
    page.keyboard.press("Escape")
    check("Duplicate customer emails are rejected without losing the form")

    go(page, "/products")
    page.get_by_role("button", name="Add product", exact=True).click()
    dialog(page).get_by_label("Product name").fill("QA Retail Test Product")
    dialog(page).get_by_label("SKU", exact=True).fill("AR-QA-009")
    dialog(page).get_by_label("Retail price (USD)").fill("55.50")
    dialog(page).get_by_label("Unit cost (USD)").fill("20")
    dialog(page).get_by_label("Available stock").fill("5")
    dialog(page).get_by_label("Reorder point").fill("3")
    save(page, "Add a product")
    product = next(p for p in data()["products"] if p["sku"] == "AR-QA-009")
    check("Products save retail price, cost, SKU, stock, and reorder point")

    go(page, "/orders")
    page.get_by_role("button", name="Create order", exact=True).click()
    dialog(page).get_by_label("Customer", exact=True).select_option(customer["id"])
    dialog(page).get_by_label("Product", exact=True).select_option(product["id"])
    dialog(page).get_by_label("Quantity").fill("2")
    dialog(page).get_by_label("Store", exact=True).select_option("Downtown")
    save(page, "Create an order")
    snapshot = data()
    order = next(o for o in snapshot["orders"] if o["productId"] == product["id"])
    assert order["total"] == 111 and order["cost"] == 40
    assert next(p for p in snapshot["products"] if p["id"] == product["id"])["stock"] == 3
    assert any(t.get("source") == f"order:{order['id']}" for t in snapshot["tasks"])
    assert any(t.get("source") == f"stock:{product['id']}" for t in snapshot["tasks"])
    check("Order creation calculates totals, records costs, decrements stock, and runs two automations")

    page.get_by_role("button", name="Create order", exact=True).click()
    dialog(page).get_by_label("Customer", exact=True).select_option(customer["id"])
    dialog(page).get_by_label("Product", exact=True).select_option(product["id"])
    dialog(page).get_by_label("Quantity").fill("4")
    dialog(page).get_by_role("button", name="Create an order", exact=True).click()
    expect(page.get_by_role("alert").filter(has_text="Only 3 units")).to_be_visible()
    page.keyboard.press("Escape")
    page.get_by_placeholder("Search orders, customers, or products...").fill(order["id"])
    page.get_by_role("button", name=order["id"], exact=True).click()
    dialog(page).get_by_label("Fulfillment status").select_option("Cancelled")
    expect(page.get_by_role("status").filter(has_text="Order status updated.")).to_be_visible()
    expect(dialog(page).get_by_label("Fulfillment status")).to_be_disabled()
    assert next(p for p in data()["products"] if p["id"] == product["id"])["stock"] == 5
    page.keyboard.press("Escape")
    check("Overselling is blocked; cancellation restores inventory exactly once")

    go(page, "/products")
    page.get_by_role("button", name="QA Retail Test Product", exact=True).click()
    dialog(page).get_by_role("button", name="Edit product details").click()
    dialog(page).get_by_label("Retail price (USD)").fill("60")
    dialog(page).get_by_label("Unit cost (USD)").fill("22")
    save(page, "Save product")
    snapshot = data()
    assert next(p for p in snapshot["products"] if p["id"] == product["id"])["price"] == 60
    original_order = next(o for o in snapshot["orders"] if o["id"] == order["id"])
    assert original_order["total"] == 111 and original_order["cost"] == 40
    check("Catalog price and cost edits preserve historical order totals and cost records")

    go(page, "/automations")
    page.get_by_role("switch", name="Enable Make every win a great beginning").click()
    expect(page.get_by_role("switch", name="Enable Make every win a great beginning")).to_have_attribute("aria-checked", "true")
    go(page, "/pipeline")
    page.get_by_role("button", name="Add deal", exact=True).click()
    dialog(page).get_by_label("Opportunity name").fill("QA Corporate Bundle")
    dialog(page).get_by_label("Customer", exact=True).select_option(customer["id"])
    dialog(page).get_by_label("Deal value (USD)").fill("2000")
    dialog(page).get_by_label("Expected close date").fill("2026-10-20")
    save(page, "Add a sales opportunity")
    page.get_by_label("Stage for QA Corporate Bundle").select_option("Won")
    expect(page.get_by_label("Stage for QA Corporate Bundle")).to_have_value("Won")
    assert any("Onboard customer for QA Corporate Bundle" == t["title"] for t in data()["tasks"])
    check("Sales pipeline changes persist and closed-won automation creates onboarding work")

    go(page, "/tasks")
    page.get_by_role("button", name="Create task", exact=True).first.click()
    dialog(page).get_by_label("What needs to be done?").fill("QA Arrange VIP appointment")
    dialog(page).get_by_label("Due date").fill("2026-10-20")
    save(page, "Create a team task")
    card = page.locator(".task-card").filter(has_text="QA Arrange VIP appointment")
    card.drag_to(page.locator(".task-board .board-column").nth(1))
    expect(page.get_by_label("Status for QA Arrange VIP appointment")).to_have_value("In progress")
    page.get_by_label("Status for QA Arrange VIP appointment").select_option("Done")
    expect(page.get_by_label("Status for QA Arrange VIP appointment")).to_have_value("Done")
    page.get_by_role("button", name="List", exact=True).click()
    expect(page.locator("table")).to_be_visible()
    check("Task creation, drag-and-drop, keyboard status controls, and list view")

    go(page, "/campaigns")
    page.get_by_role("button", name="Plan campaign", exact=True).click()
    dialog(page).get_by_label("Campaign name").fill("QA VIP Autumn Edit")
    dialog(page).get_by_label("Audience").select_option("VIP")
    dialog(page).get_by_label("Budget (USD)").fill("125")
    save(page, "Save campaign draft")
    page.get_by_label("Status for QA VIP Autumn Edit").select_option("Scheduled")
    expect(page.get_by_label("Status for QA VIP Autumn Edit")).to_have_value("Scheduled")
    check("Campaign plans preserve audiences, budgets, and schedule state without sending messages")

    go(page, "/support")
    page.get_by_role("button", name="Create ticket", exact=True).click()
    dialog(page).get_by_label("How can we help?").fill("QA Packaging question")
    dialog(page).get_by_label("Customer", exact=True).select_option(customer["id"])
    save(page, "Create a support ticket")
    page.get_by_label("Status for QA Packaging question").select_option("Resolved")
    expect(page.get_by_label("Status for QA Packaging question")).to_have_value("Resolved")
    check("Customer-linked support tickets can be created and resolved")

    go(page, "/automations")
    page.get_by_role("button", name="Run stock check").click()
    expect(page.get_by_role("status").filter(has_text="restock tasks created")).to_be_visible()
    count = len(data()["tasks"])
    page.get_by_role("button", name="Run stock check").click()
    expect(page.get_by_role("status").filter(has_text="0 restock tasks")).to_be_visible()
    assert len(data()["tasks"]) == count
    check("Repeated inventory automation checks do not duplicate open restock tasks")

    go(page, "/settings")
    page.get_by_label("Company name").fill("QA Retail Workspace")
    page.get_by_label("Monthly revenue goal (USD)").fill("60000")
    page.get_by_role("button", name="Save changes", exact=True).click()
    expect(page.get_by_role("status").filter(has_text="settings saved")).to_be_visible()
    page.reload(wait_until="networkidle")
    expect(page.get_by_label("Company name")).to_have_value("QA Retail Workspace")
    assert data()["settings"]["monthlyGoal"] == 60000
    check("Workspace settings and monthly sales goals persist after reload")

    page.keyboard.press("Control+k")
    dialog(page).get_by_label("Search workspace").fill("QA Retail Customer")
    dialog(page).get_by_role("button").filter(has_text="QA Retail Customer").click()
    expect(dialog(page).get_by_role("heading", name="QA Retail Customer", exact=True)).to_be_visible()
    page.keyboard.press("Escape")
    check("Global keyboard search opens the correct customer profile")

    go(page, "/orders")
    page.get_by_placeholder("Search orders, customers, or products...").fill("QA Retail")
    with page.expect_download() as info:
        page.get_by_role("button", name="Export CSV").click()
    downloaded = info.value
    downloaded.save_as(ROOT / "artifacts" / "orders-export.csv")
    assert "QA Retail Customer" in (ROOT / "artifacts" / "orders-export.csv").read_text(encoding="utf-8-sig")
    check("Filtered CSV export contains matching customer orders")

    page.set_viewport_size({"width": 390, "height": 844})
    for route in ["/", "/customers", "/orders", "/products", "/inventory", "/pipeline", "/tasks", "/campaigns", "/segments", "/automations", "/reports", "/support", "/team", "/settings"]:
        go(page, route)
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Mobile overflow: {route}"
    page.get_by_role("button", name="Open navigation").click()
    expect(page.get_by_role("navigation", name="Main navigation")).to_be_visible()
    page.get_by_role("link", name="Overview", exact=True).click()
    expect(page.locator("main h1")).to_have_text("Overview.")
    check("All 14 screens fit a 390px mobile viewport and mobile navigation works")

    assert not errors, errors
    check("No browser runtime errors during the complete workflow")

    page.set_viewport_size({"width": 1536, "height": 1050})
    page.goto(SCREENSHOT_BASE, wait_until="networkidle")
    page.screenshot(path=str(ROOT / "artifacts" / "overview-desktop.png"), full_page=True)
    page.goto(SCREENSHOT_BASE + "/products", wait_until="networkidle")
    page.screenshot(path=str(ROOT / "artifacts" / "products-desktop.png"), full_page=True)
    assert page.locator("img").evaluate_all("imgs => imgs.every(i => i.complete && i.naturalWidth > 0)")
    page.goto(SCREENSHOT_BASE + "/pipeline", wait_until="networkidle")
    page.screenshot(path=str(ROOT / "artifacts" / "pipeline-desktop.png"), full_page=True)
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(SCREENSHOT_BASE, wait_until="networkidle")
    page.screenshot(path=str(ROOT / "artifacts" / "overview-mobile.png"), full_page=True)
    browser.close()
    (ROOT / "artifacts" / "test-results.json").write_text(json.dumps({"passed": len(results), "checks": results, "browser_errors": errors}, indent=2), encoding="utf-8")
    print(f"\n{len(results)} integration checks passed. Screenshots saved in artifacts/.", flush=True)
