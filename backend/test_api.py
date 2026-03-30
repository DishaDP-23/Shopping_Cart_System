import requests

BASE_URL = "http://127.0.0.1:5000"


# -------------------------
# 1. Place Order
# -------------------------
def test_place_order():
    res = requests.post(
        f"{BASE_URL}/order/place",
        json={"user_id": 1}
    )
    print("\n--- Place Order ---")
    print("Status:", res.status_code)
    print("Response:", res.text)


# -------------------------
# 2. Payment
# -------------------------
def test_payment():
    res = requests.post(
        f"{BASE_URL}/payment",
        json={
            "user_id": 1,
            "payment_method": "UPI"
        }
    )
    print("\n--- Payment ---")
    print("Status:", res.status_code)
    print("Response:", res.text)


# -------------------------
# 3. Order History
# -------------------------
def test_order_history():
    res = requests.get(f"{BASE_URL}/order/history/1")
    print("\n--- Order History ---")
    print("Status:", res.status_code)
    print("Response:", res.text)


# -------------------------
# 4. Admin Dashboard
# -------------------------
def test_dashboard():
    res = requests.get(f"{BASE_URL}/admin/dashboard")
    print("\n--- Admin Dashboard ---")
    print("Status:", res.status_code)
    print("Response:", res.text)


# -------------------------
# 5. Invoice
# -------------------------
def test_invoice():
    res = requests.get(f"{BASE_URL}/invoice/1")
    print("\n--- Invoice ---")
    print("Status:", res.status_code)
    print("Response:", res.text)


# -------------------------
# RUN ALL TESTS
# -------------------------
if __name__ == "__main__":
    test_place_order()
    test_payment()
    test_order_history()
    test_dashboard()
    test_invoice()