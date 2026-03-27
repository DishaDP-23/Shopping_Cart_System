CREATE TABLE users(
  user_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,     --generated always suggests that user_id is auto-incremented and cannot be manually inserted. Similarly for other tables with generated always.
  name VARCHAR2(100) NOT NULL,
  email VARCHAR2(100) UNIQUE NOT NULL,
  password VARCHAR2(100) NOT NULL,
  role VARCHAR2(20) CHECK (role IN ('admin','customer')) NOT NULL
);

CREATE TABLE categories(
  category_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_name VARCHAR2(100) NOT NULL
);

CREATE TABLE products(
  product_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR2(150) NOT NULL,
  price NUMBER(10,2) NOT NULL,
  stock NUMBER NOT NULL CHECK(stock >= 0),
  category_id NUMBER,
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE TABLE cart(
  cart_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id NUMBER NOT NULL UNIQUE,
  --cart must always belong to user
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE cart_items(
  cart_item_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cart_id NUMBER NOT NULL,
  product_id NUMBER NOT NULL,
  --cart items must always have cart+product
  quantity NUMBER NOT NULL CHECK(quantity > 0),
  UNIQUE(cart_id, product_id),
  FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE orders(
  order_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id NUMBER,
  --guest orders allowed
  order_date DATE DEFAULT SYSDATE,
  total_amount NUMBER(10,2),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
  --if user is deleted we still want order history so NO on delete cascade
);

CREATE TABLE order_items(
  order_item_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id NUMBER NOT NULL,
  product_id NUMBER NOT NULL,
  --order item must belong to order + product
  quantity NUMBER,
  price NUMBER(10,2),
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE payments(
  payment_id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id NUMBER NOT NULL,
  --payments must always have order
  payment_method VARCHAR2(50),
  payment_date DATE DEFAULT SYSDATE,
  payment_status VARCHAR2(50),
  FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);