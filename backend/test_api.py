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
# 6. Register User
# -------------------------
def test_register():
    res = requests.post(
        f"{BASE_URL}/register",
        json={
            "name": "Naina",
            "email": "naina2@test.com",
            "password": "1234",
            "role": "customer"
        }
    )
    print("\n--- Register User ---")
    print("Status:", res.status_code)
    print("Response:", res.text)


# -------------------------
# 7. View Products
# -------------------------
def test_products():
    res = requests.get(f"{BASE_URL}/products")
    print("\n--- View Products ---")
    print("Status:", res.status_code)
    print("Response:", res.text)


# -------------------------
# 8. Add to Cart
# -------------------------
def test_add_to_cart():
    res = requests.post(
        f"{BASE_URL}/cart/add",
        json={
            "user_id": 1,
            "product_id": 1,
            "quantity": 2
        }
    )
    print("\n--- Add to Cart ---")
    print("Status:", res.status_code)
    print("Response:", res.text)


# -------------------------
# 9. Update Cart
# -------------------------
def test_update_cart():
    res = requests.post(
        f"{BASE_URL}/cart/update",
        json={
            "user_id": 1,
            "product_id": 1,
            "quantity": 3
        }
    )
    print("\n--- Update Cart ---")
    print("Status:", res.status_code)
    print("Response:", res.text)


# -------------------------
# 10. View Cart
# -------------------------
def test_view_cart():
    res = requests.get(f"{BASE_URL}/cart/1")
    print("\n--- View Cart ---")
    print("Status:", res.status_code)
    print("Response:", res.text)


# -------------------------
# 11. Cart Total
# -------------------------
def test_cart_total():
    res = requests.get(f"{BASE_URL}/cart/total/1")
    print("\n--- Cart Total ---")
    print("Status:", res.status_code)
    print("Response:", res.text)


# -------------------------
# 12. Remove from Cart
# -------------------------
def test_remove_from_cart():
    res = requests.delete(
        f"{BASE_URL}/cart/remove",
        json={
            "user_id": 1,
            "product_id": 1
        }
    )
    print("\n--- Remove from Cart ---")
    print("Status:", res.status_code)
    print("Response:", res.text)


# -------------------------
# RUN ALL TESTS
# -------------------------
if __name__ == "__main__":

    test_register()
    test_products()
    test_add_to_cart()
    test_view_cart()
    test_cart_total()
    test_update_cart()
    test_view_cart()
    test_remove_from_cart()

    test_place_order()
    test_payment()
    test_order_history()
    test_dashboard()
    test_invoice()