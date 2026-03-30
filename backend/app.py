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
# RUN APP
# -------------------------------
if __name__ == '__main__':
    app.run(debug=True)