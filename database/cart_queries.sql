--Queries--

--View Products____________________________________________________________________
SELECT 
    p.product_id,
    p.name,
    p.price,
    p.stock,
    c.category_name
FROM products p
LEFT JOIN categories c 
ON p.category_id = c.category_id;
/*left join used as products without categories need to mentioned
  as well*/

--Add Cart________________________________________________________________________

--create cart is cart doesnt exist for user
INSERT INTO cart (user_id)
SELECT &user_id FROM dual
-- : is a bind variable (value will be provided at runtime)
WHERE NOT EXISTS (
    SELECT 1 FROM cart WHERE user_id = &user_id
    --sleect 1 is just to understand if row exists or not
);

--add item to cart_______________________________________________________________________
UPDATE cart_items
SET quantity = quantity + &quantity
WHERE cart_id = (SELECT cart_id FROM cart WHERE user_id = &user_id)
AND product_id = &product_id;
--to prevent insertion of duplicated products that will violate the unique constraint , we first do update and then insert
INSERT INTO cart_items (cart_id, product_id, quantity)
SELECT 
    (SELECT cart_id FROM cart WHERE user_id = &user_id),
    &product_id,
    &quantity
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM cart_items 
    WHERE cart_id = (SELECT cart_id FROM cart WHERE user_id = &user_id)
    AND product_id = &product_id
);

--Update Cart( change quantity) _________________________________________________________________________

UPDATE cart_items
SET quantity = &quantity
WHERE product_id = &product_id
AND cart_id IN (
    SELECT cart_id FROM cart WHERE user_id = &user_id
);
--updates cart items only if cart exists
--if cart does not exist , no rows will be affected
--avoids unecessary cart creation


--remove item from cart___________________________________________________________________________

DELETE FROM cart_items
WHERE product_id = &product_id
AND cart_id IN (
    SELECT cart_id FROM cart WHERE user_id = &user_id
);

--same logic as update cart applied where rows are deleted only if cart exists

--calculate cart total _________________________________________________________________
SELECT 
    NVL(SUM(p.price * ci.quantity), 0) AS total_amount
FROM cart_items ci
JOIN products p 
ON ci.product_id = p.product_id
WHERE ci.cart_id = (
    SELECT cart_id FROM cart WHERE user_id = &user_id
);