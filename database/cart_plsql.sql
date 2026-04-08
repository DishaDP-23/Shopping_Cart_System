--register user procedure_______________________________________________________________
set serveroutput on
CREATE OR REPLACE PROCEDURE register_user_proc (
    p_name     IN VARCHAR2,
    p_email    IN VARCHAR2,
    p_password IN VARCHAR2,
    p_role     IN VARCHAR2
)
AS
BEGIN
     IF p_role NOT IN ('admin','customer') THEN
    RAISE_APPLICATION_ERROR(-20005, 'Invalid role');
    END IF;
    INSERT INTO users(name, email, password, role)
    VALUES (p_name, p_email, p_password, p_role);

   

EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        DBMS_OUTPUT.PUT_LINE('Email already registered');
END;
/

--add to cart procedure__________________________________________________________
CREATE OR REPLACE PROCEDURE add_to_cart_proc (
    p_user_id    IN NUMBER,
    p_product_id IN NUMBER,
    p_quantity   IN NUMBER
) AS
    v_cart_id cart.cart_id%TYPE;
BEGIN
    -- Validate quantity
    IF p_quantity <= 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Quantity must be positive');
    END IF;

    -- Ensure cart exists
    BEGIN
        SELECT cart_id INTO v_cart_id FROM cart WHERE user_id = p_user_id;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            --create cart
            INSERT INTO cart(user_id) VALUES (p_user_id)
            RETURNING cart_id INTO v_cart_id;
    END;

    -- Check stock
    DECLARE
        v_stock NUMBER;
    BEGIN
        SELECT stock INTO v_stock FROM products WHERE product_id = p_product_id;
       
        IF v_stock < p_quantity THEN
            RAISE_APPLICATION_ERROR(-20002, 'Insufficient stock');
        END IF;

         EXCEPTION
           WHEN NO_DATA_FOUND THEN
           RAISE_APPLICATION_ERROR(-20006, 'Product not found');
    END;

    -- update first
    UPDATE cart_items
    SET quantity = quantity + p_quantity
    WHERE cart_id = v_cart_id
    AND product_id = p_product_id;

    -- If not updated, insert
    IF SQL%ROWCOUNT = 0 THEN
        INSERT INTO cart_items(cart_id, product_id, quantity)
        VALUES (v_cart_id, p_product_id, p_quantity);
    END IF;

END;
/

--update cart procedure_________________________________________________________
CREATE OR REPLACE PROCEDURE update_cart_proc (
    p_user_id    IN NUMBER,
    p_product_id IN NUMBER,
    p_quantity   IN NUMBER
) AS
    v_cart_id cart.cart_id%TYPE;
BEGIN
    -- Get cart
    SELECT cart_id INTO v_cart_id FROM cart WHERE user_id = p_user_id;

    -- If quantity = 0 → remove item
    IF p_quantity = 0 THEN
        DELETE FROM cart_items
        WHERE cart_id = v_cart_id
        AND product_id = p_product_id;
        RETURN;
    END IF;

    -- Validate quantity
    IF p_quantity < 0 THEN
        RAISE_APPLICATION_ERROR(-20003, 'Invalid quantity');
    END IF;
    
    DECLARE
    v_stock NUMBER;
BEGIN
    SELECT stock INTO v_stock FROM products WHERE product_id = p_product_id;

    IF p_quantity > v_stock THEN
        RAISE_APPLICATION_ERROR(-20007, 'Exceeds available stock');
    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20006, 'Product not found');
END;
    -- Update
    UPDATE cart_items
    SET quantity = p_quantity
    WHERE cart_id = v_cart_id
    AND product_id = p_product_id;

    IF SQL%ROWCOUNT = 0 THEN
        DBMS_OUTPUT.PUT_LINE('Item not found in cart');
    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('Cart does not exist');
END;
/

--remove cart procedure___________________________________________________________
CREATE OR REPLACE PROCEDURE remove_cart_proc (
    p_user_id IN NUMBER
) AS
BEGIN
    DELETE FROM cart
    WHERE user_id = p_user_id;

    -- ON DELETE CASCADE removes cart_items automatically

    IF SQL%ROWCOUNT = 0 THEN
        DBMS_OUTPUT.PUT_LINE('No cart found');
    END IF;
END;
/

--get cart total_______________________________________________________________________
CREATE OR REPLACE FUNCTION get_cart_total_func (
    p_user_id IN NUMBER
) RETURN NUMBER
AS
    v_total NUMBER := 0;
BEGIN
    SELECT NVL(SUM(p.price * ci.quantity), 0)
    INTO v_total
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    WHERE ci.cart_id IN (
    SELECT cart_id FROM cart WHERE user_id = p_user_id
);

    RETURN v_total;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
END;
/

--Cart Items Report___________________________________________________________________
DECLARE
    CURSOR cart_items_report IS
        SELECT u.name, p.name AS product, ci.quantity, p.price
        FROM cart_items ci
        JOIN cart c ON ci.cart_id = c.cart_id
        JOIN users u ON c.user_id = u.user_id
        JOIN products p ON ci.product_id = p.product_id;

BEGIN
    FOR rec IN cart_items_report LOOP
        DBMS_OUTPUT.PUT_LINE(
            rec.name || ' | ' || rec.product || ' | Qty: ' || rec.quantity || ' | Price: ' || rec.price
        );
    END LOOP;
END;
/

--check Stock before Cart________________________________________________________________________
CREATE OR REPLACE TRIGGER check_stock_before_cart
BEFORE INSERT OR UPDATE ON cart_items
FOR EACH ROW
DECLARE
    v_stock NUMBER;
BEGIN
    SELECT stock INTO v_stock FROM products WHERE product_id = :NEW.product_id;
   
    IF :NEW.quantity > v_stock THEN
        RAISE_APPLICATION_ERROR(-20004, 'Not enough stock available');
    END IF;
     EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20008, 'Invalid product');
END;
/