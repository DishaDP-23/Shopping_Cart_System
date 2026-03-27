insert into categories(category_name) values ('Electronics');
insert into categories(category_name) values ('Clothing');
insert into categories(category_name) values ('Books');

insert into users(name, email, password, role) values ('Alice', 'alice@example.com', 'password123', 'customer');
insert into users(name, email, password, role) values ('Bob', 'bob@example.com', 'password456', 'admin');

insert into products(name, price, stock, category_id) values ('Laptop', 100000, 10, 1);
insert into products(name, price, stock, category_id) values ('T-Shirt', 1000, 50, 2);
insert into products(name, price, stock, category_id) values ('Whimpy Kid', 500, 40, 3);

insert into cart(user_id) values (1);

insert into cart_items(cart_id, product_id, quantity) values (1, 1, 1);
insert into cart_items(cart_id, product_id, quantity) values (1, 3, 2);

insert into orders(user_id, total_amount) values (1, 110000);

insert into order_items(order_id, product_id, quantity, price) values (1, 1, 1, 100000);
insert into order_items(order_id, product_id, quantity, price) values (1, 3, 2, 500);

insert into payments(order_id,payment_method,payment_status) values (1,'UPI','Payment Successful');