from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_connection

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
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
# User Login
# -------------------------------
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, role FROM users WHERE email=:1 AND password=:2",
        [data['email'], data['password']]
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if row:
        return jsonify({"user_id": row[0], "role": row[1]})
    return jsonify({"error": "Invalid credentials"}), 401

# -------------------------------
# 7. View Products
# -------------------------------
@app.route('/products', methods=['GET'])
def get_products():
    # Read optional query-string filter params
    category    = request.args.get('category')      # e.g. ?category=Electronics
    min_price   = request.args.get('min_price')     # e.g. ?min_price=100
    max_price   = request.args.get('max_price')     # e.g. ?max_price=5000
    in_stock    = request.args.get('in_stock')      # e.g. ?in_stock=true
    search      = request.args.get('search')        # e.g. ?search=laptop

    conn   = get_connection()
    cursor = conn.cursor()

    # Build query dynamically based on provided filters
    sql    = """
        SELECT p.product_id, p.name, p.price, p.stock, c.category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE 1=1
    """
    params = []

    if category:
        sql += " AND UPPER(c.category_name) = UPPER(:cat)"
        params.append(category)

    if min_price:
        sql += " AND p.price >= :min_p"
        params.append(float(min_price))

    if max_price:
        sql += " AND p.price <= :max_p"
        params.append(float(max_price))

    if in_stock and in_stock.lower() == 'true':
        sql += " AND p.stock > 0"

    if search:
        sql += " AND UPPER(p.name) LIKE UPPER(:srch)"
        params.append(f"%{search}%")

    sql += " ORDER BY p.product_id"

    cursor.execute(sql, params)

    products = []
    for row in cursor:
        products.append({
            "product_id":    row[0],
            "name":          row[1],
            "price":         float(row[2]),
            "stock":         row[3],
            "category_name": row[4] if row[4] else "Uncategorised",
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

# Richer admin dashboard: revenue, units sold, low-stock alerts
@app.route('/admin/analytics', methods=['GET'])
def admin_analytics():
    conn   = get_connection()
    cursor = conn.cursor()

    # Top products by revenue
    cursor.execute("""
        SELECT p.name,
               SUM(oi.quantity)             AS total_sold,
               SUM(oi.quantity * oi.price)  AS revenue,
               c.category_name
        FROM order_items oi
        JOIN products p  ON oi.product_id  = p.product_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        GROUP BY p.name, c.category_name
        ORDER BY revenue DESC
    """)
    top_products = []
    for row in cursor:
        top_products.append({
            "product":    row[0],
            "total_sold": row[1],
            "revenue":    float(row[2]),
            "category":   row[3] if row[3] else "Uncategorised",
        })

    # Low-stock alerts (stock <= 5)
    cursor.execute("""
        SELECT p.product_id, p.name, p.stock, c.category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE p.stock <= 5
        ORDER BY p.stock ASC
    """)
    low_stock = []
    for row in cursor:
        low_stock.append({
            "product_id": row[0],
            "name":       row[1],
            "stock":      row[2],
            "category":   row[3] if row[3] else "Uncategorised",
        })

    # Revenue per category
    cursor.execute("""
        SELECT c.category_name,
               SUM(oi.quantity * oi.price) AS revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        GROUP BY c.category_name
        ORDER BY revenue DESC
    """)
    category_revenue = []
    for row in cursor:
        category_revenue.append({
            "category": row[0] if row[0] else "Uncategorised",
            "revenue":  float(row[1]),
        })

    # Summary totals
    cursor.execute("SELECT COUNT(*) FROM orders")
    total_orders = cursor.fetchone()[0]

    cursor.execute("SELECT NVL(SUM(total_amount), 0) FROM orders")
    total_revenue = float(cursor.fetchone()[0])

    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'customer'")
    total_customers = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    return jsonify({
        "summary": {
            "total_orders":    total_orders,
            "total_revenue":   total_revenue,
            "total_customers": total_customers,
        },
        "top_products":     top_products,
        "low_stock":        low_stock,
        "category_revenue": category_revenue,
    })


# GET /categories — used by the filter dropdown in the frontend
@app.route('/categories', methods=['GET'])
def get_categories():
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT category_id, category_name FROM categories ORDER BY category_name")
    cats = [{"category_id": row[0], "category_name": row[1]} for row in cursor]
    cursor.close()
    conn.close()
    return jsonify(cats)



# -------------------------------
# RUN APP
# -------------------------------
if __name__ == '__main__':
    app.run(debug=True)