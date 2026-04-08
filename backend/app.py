
from flask import Flask, request, jsonify
from flask_cors import CORS
from db import get_connection

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# check_stock_before_cart  → BEFORE INSERT OR UPDATE on cart_items
# reduce_stock_trigger     → AFTER INSERT on order_items

# 1. PLACE ORDER
# PL/SQL: place_order_proc(p_user_id)
# TRIGGER: reduce_stock_trigger fires 
@app.route('/order/place', methods=['POST'])
def place_order():
    data    = request.json
    user_id = data['user_id']

    conn   = get_connection()
    cursor = conn.cursor()

    try:
        cursor.callproc("place_order_proc", [user_id])
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "Order placed successfully"})


# 2. PAYMENT
# PL/SQL: insert_payment_proc(p_user_id, p_method)
@app.route('/payment', methods=['POST'])
def payment():
    data    = request.json
    user_id = data['user_id']
    method  = data['payment_method']

    conn   = get_connection()
    cursor = conn.cursor()

    try:
        cursor.callproc("insert_payment_proc", [user_id, method])
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "Payment recorded"})

# 3. ORDER TOTAL
# PL/SQL: calculate_order_total_func(p_user_id)
@app.route('/order/total/<int:user_id>', methods=['GET'])
def order_total(user_id):
    conn   = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT calculate_order_total_func(:1) FROM dual", [user_id]
    )
    total = cursor.fetchone()[0]

    cursor.close()
    conn.close()
    return jsonify({
        "user_id":     user_id,
        "order_total": float(total) if total else 0
    })


# 4. ORDER HISTORY
@app.route('/order/history/<int:user_id>', methods=['GET'])
def order_history(user_id):
    conn   = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT o.order_id, p.name, oi.quantity, oi.price, o.order_date
        FROM orders o
        JOIN order_items oi ON o.order_id  = oi.order_id
        JOIN products   p  ON oi.product_id = p.product_id
        WHERE o.user_id = :1
        ORDER BY o.order_date DESC
    """, [user_id])

    data = []
    for row in cursor:
        data.append({
            "order_id": row[0],
            "product":  row[1],
            "quantity": row[2],
            "price":    float(row[3]),
            "date":     str(row[4])
        })

    cursor.close()
    conn.close()
    return jsonify(data)

# 5. INVOICE
@app.route('/invoice/<int:user_id>', methods=['GET'])
def invoice(user_id):
    conn   = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT o.order_id, p.name, oi.quantity, oi.price
        FROM orders o
        JOIN order_items oi ON o.order_id   = oi.order_id
        JOIN products   p  ON oi.product_id  = p.product_id
        WHERE o.user_id = :1
        ORDER BY o.order_id DESC
    """, [user_id])

    data = []
    for row in cursor:
        data.append({
            "order_id": row[0],
            "product":  row[1],
            "quantity": row[2],
            "price":    float(row[3])
        })

    cursor.close()
    conn.close()
    return jsonify(data)


# 6. ADMIN SALES REPORT
# PL/SQL CURSOR (order_plsql.sql): sales_cursor

@app.route('/admin/sales-report', methods=['GET'])
def sales_report():
    conn   = get_connection()
    cursor = conn.cursor()

    # Mirrors the sales_cursor from order_plsql.sql
    cursor.execute("""
        SELECT p.name, SUM(oi.quantity) AS total_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        GROUP BY p.name
        ORDER BY total_sold DESC
    """)

    report = []
    for row in cursor:
        report.append({
            "product":    row[0],
            "total_sold": row[1]
        })

    cursor.close()
    conn.close()
    return jsonify(report)

# 7. ADMIN CART REPORT
# PL/SQL CURSOR (cart_plsql.sql): cart_items_report
@app.route('/admin/cart-report', methods=['GET'])
def cart_report():
    conn   = get_connection()
    cursor = conn.cursor()

    # Mirrors the cart_items_report cursor from cart_plsql.sql
    cursor.execute("""
        SELECT u.name, p.name AS product, ci.quantity, p.price
        FROM cart_items ci
        JOIN cart     c ON ci.cart_id    = c.cart_id
        JOIN users    u ON c.user_id     = u.user_id
        JOIN products p ON ci.product_id = p.product_id
        ORDER BY u.name
    """)

    report = []
    for row in cursor:
        report.append({
            "user":     row[0],
            "product":  row[1],
            "quantity": row[2],
            "price":    float(row[3])
        })

    cursor.close()
    conn.close()
    return jsonify(report)

# 8. ADMIN DASHBOARD / ANALYTICS
@app.route('/admin/analytics', methods=['GET'])
def dashboard():
    conn   = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.name,
               SUM(oi.quantity)            AS total_sold,
               SUM(oi.quantity * oi.price) AS revenue,
               c.category_name
        FROM order_items oi
        JOIN products    p ON oi.product_id  = p.product_id
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
            "category":   row[3] if row[3] else "Uncategorised"
        })

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
            "category":   row[3] if row[3] else "Uncategorised"
        })

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
            "revenue":  float(row[1])
        })

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
            "total_customers": total_customers
        },
        "top_products":     top_products,
        "low_stock":        low_stock,
        "category_revenue": category_revenue
    })


# 9. USER REGISTRATION
# PL/SQL: register_user_proc(p_name, p_email, p_password, p_role)
@app.route('/register', methods=['POST'])
def register():
    data     = request.json
    name     = data['name']
    email    = data['email']
    password = data['password']
    role     = data.get('role', 'customer')

    conn   = get_connection()
    cursor = conn.cursor()

    try:
        # Check BEFORE calling the procedure
        cursor.execute("SELECT COUNT(*) FROM users WHERE email = :1", [email])
        if cursor.fetchone()[0] > 0:
            return jsonify({"error": "Email already registered"}), 400

        cursor.callproc("register_user_proc", [name, email, password, role])
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "User registered successfully"})

# 10. USER LOGIN
@app.route('/login', methods=['POST'])
def login():
    data   = request.json
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


# 11. VIEW PRODUCTS
@app.route('/products', methods=['GET'])
def get_products():
    category  = request.args.get('category')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    in_stock  = request.args.get('in_stock')
    search    = request.args.get('search')

    conn   = get_connection()
    cursor = conn.cursor()

    sql = """
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
            "category_name": row[4] if row[4] else "Uncategorised"
        })

    cursor.close()
    conn.close()
    return jsonify(products)

# 12. ADD TO CART
# PL/SQL: add_to_cart_proc(p_user_id, p_product_id, p_quantity)
#   TRIGGER: check_stock_before_cart fires BEFORE INSERT OR UPDATE
#     on cart_items 
@app.route('/cart/add', methods=['POST'])
def add_to_cart():
    data       = request.json
    user_id    = data['user_id']
    product_id = data['product_id']
    quantity   = data['quantity']

    conn   = get_connection()
    cursor = conn.cursor()

    try:
        cursor.callproc("add_to_cart_proc", [user_id, product_id, quantity])
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "Item added to cart successfully"})

# 13. UPDATE CART
# PL/SQL: update_cart_proc(p_user_id, p_product_id, p_quantity)
# TRIGGER: check_stock_before_cart fires BEFORE UPDATE on cart_items

@app.route('/cart/update', methods=['POST'])
def update_cart():
    data       = request.json
    user_id    = data['user_id']
    product_id = data['product_id']
    quantity   = data['quantity']

    conn   = get_connection()
    cursor = conn.cursor()

    try:
        cursor.callproc("update_cart_proc", [user_id, product_id, quantity])
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "Cart updated"})

# 14. REMOVE CART (entire cart)
# PL/SQL: remove_cart_proc(p_user_id)
@app.route('/cart/remove', methods=['DELETE'])
def remove_cart():
    data    = request.json
    user_id = data['user_id']

    conn   = get_connection()
    cursor = conn.cursor()

    try:
        cursor.callproc("remove_cart_proc", [user_id])
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "Cart removed"})



# 15. VIEW CART
@app.route('/cart/<int:user_id>', methods=['GET'])
def view_cart(user_id):
    conn   = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT p.product_id,
               p.name,
               p.price,
               ci.quantity,
               (p.price * ci.quantity) AS subtotal
        FROM cart_items ci
        JOIN cart     c ON ci.cart_id    = c.cart_id
        JOIN products p ON ci.product_id = p.product_id
        WHERE c.user_id = :1
    """, [user_id])

    items = []
    for row in cursor:
        items.append({
            "product_id": row[0],
            "name":       row[1],
            "price":      float(row[2]),
            "quantity":   row[3],
            "subtotal":   float(row[4])
        })

    cursor.close()
    conn.close()
    return jsonify(items)



# 16. CART TOTAL
# PL/SQL: get_cart_total_func(p_user_id) RETURN NUMBER
@app.route('/cart/total/<int:user_id>', methods=['GET'])
def cart_total(user_id):
    conn   = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT get_cart_total_func(:1) FROM dual", [user_id]
    )
    total = cursor.fetchone()[0]

    cursor.close()
    conn.close()
    return jsonify({
        "user_id": user_id,
        "total":   float(total) if total else 0
    })



# 17. CATEGORIES
@app.route('/categories', methods=['GET'])
def get_categories():
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT category_id, category_name FROM categories ORDER BY category_name"
    )
    cats = [{"category_id": row[0], "category_name": row[1]} for row in cursor]
    cursor.close()
    conn.close()
    return jsonify(cats)


#run app
if __name__ == '__main__':
    app.run(debug=True)