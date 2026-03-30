-- =====================================================
-- ORDER MODULE - SQL QUERIES
-- =====================================================

-- 1. Create a new order for a user
INSERT INTO orders(user_id, total_amount)
VALUES (&user_id, 0);


-- 2. Insert order items from user's cart
INSERT INTO order_items(order_id, product_id, quantity, price)
SELECT 
    (SELECT order_id FROM orders
     WHERE user_id = &user_id
     ORDER BY order_date DESC
     FETCH FIRST 1 ROWS ONLY),
    ci.product_id,
    ci.quantity,
    p.price
FROM cart_items ci
JOIN products p
ON ci.product_id = p.product_id
WHERE ci.cart_id = (
    SELECT cart_id FROM cart WHERE user_id = &user_id
);


-- 3. Update stock after placing order
UPDATE products p
SET stock = stock - (
    SELECT ci.quantity
    FROM cart_items ci
    WHERE ci.product_id = p.product_id
    AND ci.cart_id = (
        SELECT cart_id FROM cart WHERE user_id = &user_id
    )
)
WHERE EXISTS (
    SELECT 1 FROM cart_items ci
    WHERE ci.product_id = p.product_id
    AND ci.cart_id = (
        SELECT cart_id FROM cart WHERE user_id = &user_id
    )
);


-- 4. Calculate total order amount
SELECT SUM(quantity * price) AS total_amount
FROM order_items
WHERE order_id = (
    SELECT order_id FROM orders
    WHERE user_id = &user_id
    ORDER BY order_date DESC
    FETCH FIRST 1 ROWS ONLY
);


-- 5. Update total amount in orders table
UPDATE orders
SET total_amount = (
    SELECT SUM(quantity * price)
    FROM order_items
    WHERE order_id = orders.order_id
)
WHERE user_id = &user_id;


-- 6. Insert payment details
INSERT INTO payments(order_id, payment_method, payment_status)
VALUES (
    (SELECT order_id FROM orders
     WHERE user_id = &user_id
     ORDER BY order_date DESC
     FETCH FIRST 1 ROWS ONLY),
    '&payment_method',
    'PENDING'
);


-- 7. Update payment status
UPDATE payments
SET payment_status = '&status'
WHERE order_id = (
    SELECT order_id FROM orders
    WHERE user_id = &user_id
    ORDER BY order_date DESC
    FETCH FIRST 1 ROWS ONLY
);


-- 8. Display order history (JOIN + ORDER BY)
SELECT 
    o.order_id,
    u.name,
    p.name AS product_name,
    oi.quantity,
    oi.price,
    o.order_date
FROM orders o
JOIN users u ON o.user_id = u.user_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.user_id = &user_id
ORDER BY o.order_date DESC;


-- 9. Display total sales per product (GROUP BY)
SELECT 
    p.name,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.quantity * oi.price) AS revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.name
ORDER BY revenue DESC;S