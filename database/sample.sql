-- =====================================================
-- SAMPLE DATA — FULL FILE (Oracle SQL)
-- =====================================================

-- Users


-- Categories (original 3 + 2 new)
INSERT INTO categories(category_name) VALUES ('Electronics');
INSERT INTO categories(category_name) VALUES ('Clothing');
INSERT INTO categories(category_name) VALUES ('Books');
INSERT INTO categories(category_name) VALUES ('Home');
INSERT INTO categories(category_name) VALUES ('Sports');
-- category_id: 1=Electronics, 2=Clothing, 3=Books, 4=Home & Kitchen, 5=Sports

-- =====================================================
-- PRODUCTS (50 total)
-- =====================================================

-- Electronics (category_id = 1) — 10 products
INSERT INTO products(name, price, stock, category_id) VALUES ('Wireless Bluetooth Headphones',  3000,  50, 1);
INSERT INTO products(name, price, stock, category_id) VALUES ('Mechanical Keyboard',            5999,  35, 1);
INSERT INTO products(name, price, stock, category_id) VALUES ('USB-C Hub ',                     3500,  80, 1);
INSERT INTO products(name, price, stock, category_id) VALUES ('Portable Power Bank 20000mAh',   3500,  60, 1);
INSERT INTO products(name, price, stock, category_id) VALUES ('Smart LED Desk Lamp',            1800,  45, 1);
INSERT INTO products(name, price, stock, category_id) VALUES ('Wireless Mouse',                 2499,  90, 1);
INSERT INTO products(name, price, stock, category_id) VALUES ('HD Webcam 1080p',                4999,  40, 1);
INSERT INTO products(name, price, stock, category_id) VALUES ('Bluetooth Speaker',              3200,  55, 1);
INSERT INTO products(name, price, stock, category_id) VALUES ('Smart Plug Wi-Fi',               1699, 120, 1);
INSERT INTO products(name, price, stock, category_id) VALUES ('Laptop Stand Adjustable',        700,  70, 1);

-- Clothing (category_id = 2) — 10 products
INSERT INTO products(name, price, stock, category_id) VALUES ('Classic White T-Shirt',          450, 200, 2);
INSERT INTO products(name, price, stock, category_id) VALUES ('Slim Fit Chinos',                750, 150, 2);
INSERT INTO products(name, price, stock, category_id) VALUES ('Hoodie Charcoal Grey',           1500, 120, 2);
INSERT INTO products(name, price, stock, category_id) VALUES ('Running Shorts',                 850, 180, 2);
INSERT INTO products(name, price, stock, category_id) VALUES ('Denim Jacket',                   3000,  80, 2);
INSERT INTO products(name, price, stock, category_id) VALUES ('Wool Blend Beanie',              2500, 250, 2);
INSERT INTO products(name, price, stock, category_id) VALUES ('Athletic Socks 6-Pack',          900, 300, 2);
INSERT INTO products(name, price, stock, category_id) VALUES ('Lightweight Rain Jacket',        1200,  60, 2);
INSERT INTO products(name, price, stock, category_id) VALUES ('Polo Shirt',                     1000, 140, 2);
INSERT INTO products(name, price, stock, category_id) VALUES ('Compression Leggings',           600, 110, 2);

-- Books (category_id = 3) — 10 products
INSERT INTO products(name, price, stock, category_id) VALUES ('Clean Code',                     500, 100, 3);
INSERT INTO products(name, price, stock, category_id) VALUES ('The Pragmatic Programmer',       650,  80, 3);
INSERT INTO products(name, price, stock, category_id) VALUES ('Atomic Habits',                  399, 200, 3);
INSERT INTO products(name, price, stock, category_id) VALUES ('Deep Work',                      499, 150, 3);
INSERT INTO products(name, price, stock, category_id) VALUES ('Designing Data-Intensive Apps',  399,  60, 3);
INSERT INTO products(name, price, stock, category_id) VALUES ('You Don''t Know JS',             500,  90, 3);
INSERT INTO products(name, price, stock, category_id) VALUES ('The Psychology of Money',        399, 175, 3);
INSERT INTO products(name, price, stock, category_id) VALUES ('Sapiens',                        450, 220, 3);
INSERT INTO products(name, price, stock, category_id) VALUES ('Thinking Fast and Slow',         229, 130, 3);
INSERT INTO products(name, price, stock, category_id) VALUES ('The Lean Startup',               650, 110, 3);

-- Home & Kitchen (category_id = 4) — 10 products
INSERT INTO products(name, price, stock, category_id) VALUES ('Stainless Steel Water Bottle 1L', 750, 180, 4);
INSERT INTO products(name, price, stock, category_id) VALUES ('Non-Stick Frying Pan',            1200,  90, 4);
INSERT INTO products(name, price, stock, category_id) VALUES ('French Press Coffee Maker',       2800,  75, 4);
INSERT INTO products(name, price, stock, category_id) VALUES ('Bamboo Cutting Board Set',        1400, 100, 4);
INSERT INTO products(name, price, stock, category_id) VALUES ('Digital Kitchen Scale',           750, 130, 4);
INSERT INTO products(name, price, stock, category_id) VALUES ('Ceramic Mug Set 4-Pack',          1800, 160, 4);
INSERT INTO products(name, price, stock, category_id) VALUES ('Airtight Storage Container Set',  1250,  85, 4);
INSERT INTO products(name, price, stock, category_id) VALUES ('Electric Kettle',                 3999,  70, 4);
INSERT INTO products(name, price, stock, category_id) VALUES ('Spice Rack Organiser',            2100,  95, 4);
INSERT INTO products(name, price, stock, category_id) VALUES ('Silicone Baking Mat 2-Pack',      1499, 200, 4);

-- Sports (category_id = 5) — 10 products
INSERT INTO products(name, price, stock, category_id) VALUES ('Yoga Mat 6mm',                   2999, 120, 5);
INSERT INTO products(name, price, stock, category_id) VALUES ('Adjustable Dumbbell Set',        18999,  30, 5);
INSERT INTO products(name, price, stock, category_id) VALUES ('Resistance Bands Set 5-Pack',     2199, 160, 5);
INSERT INTO products(name, price, stock, category_id) VALUES ('Jump Rope Speed Cable',           1699, 200, 5);
INSERT INTO products(name, price, stock, category_id) VALUES ('Running Belt Waist Pack',         1899, 140, 5);
INSERT INTO products(name, price, stock, category_id) VALUES ('Foam Roller 45cm',                2499, 100, 5);
INSERT INTO products(name, price, stock, category_id) VALUES ('Gym Gloves with Wrist Wrap',      1799, 150, 5);
INSERT INTO products(name, price, stock, category_id) VALUES ('Hiking Backpack 40L',             4499,  45, 5);
INSERT INTO products(name, price, stock, category_id) VALUES ('Stainless Steel Protein Shaker',  1499, 220, 5);
INSERT INTO products(name, price, stock, category_id) VALUES ('Camping Headlamp 350 Lumen',      2399,  80, 5);

-- =====================================================
-- CART & ORDER SAMPLE DATA
-- =====================================================



COMMIT;
