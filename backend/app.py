from flask import Flask, request, jsonify
from db import get_connection

app = Flask(__name__)

# -------------------------------
# 1. Place Order (PL/SQL)
# -------------------------------
@app.route('/order/place', methods=['POST'])
def place_order():
    data = request.json
    user_id = data['user_id']

    conn = get_connection()
    cursor = conn.cursor()

    cursor.callproc("place_order_proc", [user_id])

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Order placed successfully"})


# -------------------------------
# 2. Payment
# -------------------------------
@app.route('/payment', methods=['POST'])
def payment():
    data = request.json
    user_id = data['user_id']
    method = data['payment_method']

    conn = get_connection()
    cursor = conn.cursor()

    cursor.callproc("insert_payment_proc", [user_id, method])

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Payment recorded"})


# -------------------------------
# 3. Order History
# -------------------------------
@app.route('/order/history/<int:user_id>', methods=['GET'])
def order_history(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT o.order_id, p.name, oi.quantity, oi.price, o.order_date
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE o.user_id = :1
        ORDER BY o.order_date DESC
    """, [user_id])

    data = []
    for row in cursor:
        data.append({
            "order_id": row[0],
            "product": row[1],
            "quantity": row[2],
            "price": float(row[3]),
            "date": str(row[4])
        })

    cursor.close()
    conn.close()

    return jsonify(data)


# -------------------------------
# 4. Admin Dashboard
# -------------------------------
@app.route('/admin/dashboard', methods=['GET'])
def dashboard():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.name, SUM(oi.quantity), SUM(oi.quantity * oi.price)
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        GROUP BY p.name
        ORDER BY 3 DESC
    """)

    data = []
    for row in cursor:
        data.append({
            "product": row[0],
            "total_sold": row[1],
            "revenue": float(row[2])
        })

    cursor.close()
    conn.close()

    return jsonify(data)


# -------------------------------
# 5. Invoice
# -------------------------------
@app.route('/invoice/<int:user_id>', methods=['GET'])
def invoice(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT o.order_id, p.name, oi.quantity, oi.price
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE o.user_id = :1
        ORDER BY o.order_id DESC
    """, [user_id])

    data = []
    for row in cursor:
        data.append({
            "order_id": row[0],
            "product": row[1],
            "quantity": row[2],
            "price": float(row[3])
        })

    cursor.close()
    conn.close()

    return jsonify(data)

# -------------------------------
# 6. User Registration
# -------------------------------
@app.route('/register', methods=['POST'])
def register():
    data = request.json

    name = data['name']
    email = data['email']
    password = data['password']
    role = data.get('role', 'customer')

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO users (name, email, password, role)
        VALUES (:1, :2, :3, :4)
    """, [name, email, password, role])

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "User registered successfully"})


# -------------------------------
# 7. View Products
# -------------------------------
@app.route('/products', methods=['GET'])
def get_products():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT product_id, name, price, stock
        FROM products
    """)

    products = []
    for row in cursor:
        products.append({
            "product_id": row[0],
            "name": row[1],
            "price": float(row[2]),
            "stock": row[3]
        })

    cursor.close()
    conn.close()

    return jsonify(products)


# -------------------------------
# 8. Add to Cart
# -------------------------------

@app.route('/cart/add', methods=['POST'])
def add_to_cart():
    data = request.json

    user_id = data['user_id']
    product_id = data['product_id']
    quantity = data['quantity']

    conn = get_connection()
    cursor = conn.cursor()

    # Check stock availability
    cursor.execute("""
        SELECT stock
        FROM products
        WHERE product_id = :1
    """, [product_id])

    stock_row = cursor.fetchone()

    if stock_row is None:
        cursor.close()
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    available_stock = stock_row[0]

    if quantity > available_stock:
        cursor.close()
        conn.close()
        return jsonify({"error": "Insufficient stock"}), 400

    # Check if cart exists
    cursor.execute("""
        SELECT cart_id
        FROM cart
        WHERE user_id = :1
    """, [user_id])

    row = cursor.fetchone()

    # Create cart if not exists
    if row is None:
        cursor.execute("""
            INSERT INTO cart (user_id)
            VALUES (:1)
        """, [user_id])

        conn.commit()

        cursor.execute("""
            SELECT cart_id
            FROM cart
            WHERE user_id = :1
        """, [user_id])

        row = cursor.fetchone()

    cart_id = row[0]

    # Check if product already exists in cart
    cursor.execute("""
        SELECT quantity
        FROM cart_items
        WHERE cart_id = :1 AND product_id = :2
    """, [cart_id, product_id])

    existing_item = cursor.fetchone()

    if existing_item:
        new_quantity = existing_item[0] + quantity

        # Recheck against stock
        if new_quantity > available_stock:
            cursor.close()
            conn.close()
            return jsonify({"error": "Total quantity exceeds stock"}), 400

        cursor.execute("""
            UPDATE cart_items
            SET quantity = :1
            WHERE cart_id = :2 AND product_id = :3
        """, [new_quantity, cart_id, product_id])

    else:
        cursor.execute("""
            INSERT INTO cart_items (cart_id, product_id, quantity)
            VALUES (:1, :2, :3)
        """, [cart_id, product_id, quantity])

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Item added to cart successfully"})

# -------------------------------
# 9. Update Cart
# -------------------------------
@app.route('/cart/update', methods=['POST'])
def update_cart():
    data = request.json

    user_id = data['user_id']
    product_id = data['product_id']
    quantity = data['quantity']

    conn = get_connection()
    cursor = conn.cursor()

    # Check stock
    cursor.execute("""
        SELECT stock
        FROM products
        WHERE product_id = :1
    """, [product_id])

    stock_row = cursor.fetchone()

    if stock_row is None:
        cursor.close()
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    stock = stock_row[0]

    if quantity > stock:
        cursor.close()
        conn.close()
        return jsonify({"error": "Insufficient stock"}), 400

    cursor.execute("""
        SELECT cart_id
        FROM cart
        WHERE user_id = :1
    """, [user_id])

    cart_id = cursor.fetchone()[0]

    cursor.execute("""
        UPDATE cart_items
        SET quantity = :1
        WHERE cart_id = :2 AND product_id = :3
    """, [quantity, cart_id, product_id])

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Cart updated"}) 


# -------------------------------
# 10. Remove from Cart
# -------------------------------
@app.route('/cart/remove', methods=['DELETE'])
def remove_from_cart():
    data = request.json

    user_id = data['user_id']
    product_id = data['product_id']

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT cart_id FROM cart WHERE user_id = :1
    """, [user_id])

    cart_id = cursor.fetchone()[0]

    cursor.execute("""
        DELETE FROM cart_items
        WHERE cart_id = :1 AND product_id = :2
    """, [cart_id, product_id])

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Item removed"})

# -------------------------------
# 11. View Cart
# -------------------------------
@app.route('/cart/<int:user_id>', methods=['GET'])
def view_cart(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.product_id,
               p.name,
               p.price,
               ci.quantity,
               (p.price * ci.quantity) AS subtotal
        FROM cart_items ci
        JOIN cart c ON ci.cart_id = c.cart_id
        JOIN products p ON ci.product_id = p.product_id
        WHERE c.user_id = :1
    """, [user_id])

    items = []

    for row in cursor:
        items.append({
            "product_id": row[0],
            "name": row[1],
            "price": float(row[2]),
            "quantity": row[3],
            "subtotal": float(row[4])
        })

    cursor.close()
    conn.close()

    return jsonify(items)
# -------------------------------
# 12. Cart Total
# -------------------------------
@app.route('/cart/total/<int:user_id>', methods=['GET'])
def cart_total(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT SUM(ci.quantity * p.price)
        FROM cart_items ci
        JOIN cart c ON ci.cart_id = c.cart_id
        JOIN products p ON ci.product_id = p.product_id
        WHERE c.user_id = :1
    """, [user_id])

    total = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    return jsonify({
        "user_id": user_id,
        "total": float(total) if total else 0
    })


# -------------------------------
# RUN APP
# -------------------------------
if __name__ == '__main__':
    app.run(debug=True)