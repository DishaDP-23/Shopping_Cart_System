--PROCEDURE TO PLACE ORDER____________________________________________________________________
SET SERVEROUTPUT ON;

CREATE OR REPLACE PROCEDURE place_order_proc (
    p_user_id IN NUMBER
)
AS
    v_cart_id NUMBER;
    v_order_id NUMBER;
BEGIN
    -- Fetch cart id
    SELECT cart_id INTO v_cart_id
    FROM cart
    WHERE user_id = p_user_id;

    -- Create order
    INSERT INTO orders(user_id, total_amount)
    VALUES (p_user_id, 0)
    RETURNING order_id INTO v_order_id;

    -- Insert order items
    INSERT INTO order_items(order_id, product_id, quantity, price)
    SELECT v_order_id, ci.product_id, ci.quantity, p.price
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    WHERE ci.cart_id = v_cart_id;

    -- Update total amount
    UPDATE orders
    SET total_amount = (
        SELECT SUM(quantity * price)
        FROM order_items
        WHERE order_id = v_order_id
    )
    WHERE order_id = v_order_id;

    -- Clear cart after order
    DELETE FROM cart_items WHERE cart_id = v_cart_id;

    DBMS_OUTPUT.PUT_LINE('Order placed successfully');

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('Cart not found');
END;
/

-- FUNCTIO TO CALCULATE ORDER TOTAL____________________________________________________________________
CREATE OR REPLACE FUNCTION calculate_order_total_func (
    p_user_id IN NUMBER
) RETURN NUMBER
AS
    v_total NUMBER;
BEGIN
    SELECT NVL(SUM(oi.quantity * oi.price), 0)
    INTO v_total
    FROM order_items oi
    WHERE oi.order_id = (
        SELECT order_id FROM orders
        WHERE user_id = p_user_id
        ORDER BY order_date DESC
        FETCH FIRST 1 ROWS ONLY
    );

    RETURN v_total;
END;
/


-- PROCEDURE TO INSERT PAYMENT____________________________________________________________________
CREATE OR REPLACE PROCEDURE insert_payment_proc (
    p_user_id IN NUMBER,
    p_method  IN VARCHAR2
)
AS
    v_order_id NUMBER;
BEGIN
    SELECT order_id INTO v_order_id
    FROM orders
    WHERE user_id = p_user_id
    ORDER BY order_date DESC
    FETCH FIRST 1 ROWS ONLY;

    INSERT INTO payments(order_id, payment_method, payment_status)
    VALUES (v_order_id, p_method, 'PENDING');

    DBMS_OUTPUT.PUT_LINE('Payment inserted');
END;
/


-- CURSOR FOR SALES REPORT____________________________________________________________________
DECLARE
    CURSOR sales_cursor IS
        SELECT p.name, SUM(oi.quantity) total_sold
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        GROUP BY p.name;

BEGIN
    FOR rec IN sales_cursor LOOP
        DBMS_OUTPUT.PUT_LINE(rec.name || ' - ' || rec.total_sold);
    END LOOP;
END;
/


-- TRIGGER TO REDUCE STOCK ON ORDER PLACEMENT____________________________________________________________________
CREATE OR REPLACE TRIGGER reduce_stock_trigger
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products
    SET stock = stock - :NEW.quantity
    WHERE product_id = :NEW.product_id;
END;
/

