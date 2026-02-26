"""One-time script to buy through MARS/USDT sell walls on LATOKEN."""

import time
from latoken.client import LatokenClient

API_KEY = "d3b828a7-9f01-4410-a9ff-79ac966ec590"
API_SECRET = b"ZDE5YTM1MTktZTQ5Ny00YjA2LTg0ZmEtMjFlMDVlOGRhOWZj"

client = LatokenClient(apiKey=API_KEY, apiSecret=API_SECRET)

# Resolve currency IDs
currencies = client.getCurrencies()
currency_map = {}
for c in currencies:
    if c.get("status") == "CURRENCY_STATUS_ACTIVE":
        currency_map[c["tag"]] = c["id"]

mars_id = currency_map.get("MARS")
usdt_id = currency_map.get("USDT")
print(f"MARS ID: {mars_id}")
print(f"USDT ID: {usdt_id}")

# Check balances
usdt_bal = client.getAccountBalances(currency=usdt_id, account_type="ACCOUNT_TYPE_SPOT")
mars_bal = client.getAccountBalances(currency=mars_id, account_type="ACCOUNT_TYPE_SPOT")
print(f"\nUSDT balance: available={usdt_bal.get('available')}, blocked={usdt_bal.get('blocked')}")
print(f"MARS balance: available={mars_bal.get('available')}, blocked={mars_bal.get('blocked')}")

# Get orderbook
book = client.getOrderbook(pair="MARS/USDT", limit=50)
asks = book.get("ask", [])
print(f"\nSell wall ({len(asks)} levels):")
print(f"{'Price':>18}  {'MARS Amt':>14}  {'Cost USDT':>12}  {'Cumulated':>12}")

cumulated = 0.0
for a in asks:
    price = float(a["price"])
    qty = float(a["quantity"])
    cost = price * qty
    cumulated += cost
    print(f"{price:>18.11f}  {qty:>14.2f}  {cost:>12.4f}  {cumulated:>12.4f}")

# Buy through the asks
usdt_available = float(usdt_bal.get("available", 0))
print(f"\n--- BUYING with {usdt_available:.4f} USDT ---\n")

spent = 0.0
for a in asks:
    if spent >= usdt_available - 0.01:
        print("Out of USDT, stopping.")
        break

    price = float(a["price"])
    qty = float(a["quantity"])
    level_cost = price * qty
    remaining_usdt = usdt_available - spent

    if level_cost <= remaining_usdt:
        buy_qty = qty
    else:
        buy_qty = remaining_usdt / price
        buy_qty = float(int(buy_qty * 100) / 100)  # floor to 2 decimals

    if buy_qty <= 0:
        print(f"  Skip price={price:.11f}, can't afford minimum quantity")
        continue

    cost_estimate = price * buy_qty
    print(f"  Buying {buy_qty:.2f} MARS @ {price:.11f} (cost ~${cost_estimate:.4f} USDT)...")

    result = client.placeOrder(
        pair="MARS/USDT",
        side="BUY",
        client_message=f"wall-buy-{int(time.time())}",
        price=price,
        quantity=buy_qty,
        timestamp=int(time.time() * 1000),
        condition="GOOD_TILL_CANCELLED",
        order_type="LIMIT",
    )

    status = result.get("status", "UNKNOWN")
    order_id = result.get("id", "")
    msg = result.get("message", "")
    print(f"    -> {status}: {msg} (id={order_id})")

    if status == "SUCCESS":
        spent += cost_estimate
        print(f"    Spent so far: ${spent:.4f} USDT")
    else:
        print(f"    Order failed, trying next level...")

    time.sleep(0.5)

# Final balances
print("\n--- FINAL BALANCES ---")
usdt_bal = client.getAccountBalances(currency=usdt_id, account_type="ACCOUNT_TYPE_SPOT")
mars_bal = client.getAccountBalances(currency=mars_id, account_type="ACCOUNT_TYPE_SPOT")
print(f"USDT: available={usdt_bal.get('available')}, blocked={usdt_bal.get('blocked')}")
print(f"MARS: available={mars_bal.get('available')}, blocked={mars_bal.get('blocked')}")
print(f"\nTotal estimated USDT spent: ${spent:.4f}")
