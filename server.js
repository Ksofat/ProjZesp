const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const upload = multer();
const cors = require('cors'); // Add cors import
const session = require('express-session');
const cookieParser = require('cookie-parser');
const sharp = require('sharp');
const app = express();
const bcrypt = require('bcryptjs');
const port = process.env.PORT || 3000;

// Enter your connection string here
const connectionString = "postgresql://11mat11:mrGKdd2_QkADOt9E5wh9kA@projzespkebab-9261.7tc.aws-eu-central-1.cockroachlabs.cloud:26257/Kebab?sslmode=verify-full";

// Database connection configuration
const pool = new Pool({
    connectionString: connectionString
});

// Middleware for parsing cookies
app.use(cookieParser());

// Middleware for handling file uploads
app.use(upload.single('image'));

// Middleware for parsing JSON data
app.use(express.json());

// Add cors middleware
app.use(cors());

// Session configuration
app.use(session({
    secret: '11dziwne_ciastko11',
    resave: false,
    saveUninitialized: true,
    name: '11ciastko11',
    cookie: {
        secure: false,
    }
}));
// User registration endpoint
app.post('/register', async (req, res) => {
    const { firstname, lastname, email, password, phonenumber } = req.body;
    try {
        // Check if the email already exists in the database
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Insert new user into the database
        const queryResult = await pool.query(
            'INSERT INTO users (firstname, lastname, email, password, phonenumber, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [firstname, lastname, email, hashedPassword, phonenumber, 'U']
        );
        res.status(201).json(queryResult.rows[0]);
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// User login endpoint
app.post('/login', async (req, res) => {
    console.log(req.body)
    const { email, password } = req.body;
    console.log("Received cookies:", Object.keys(req.cookies))
    try {
        // Check if a user with the given email exists
        const userQueryResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userQueryResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Check password correctness
        const user = userQueryResult.rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            // Create a session for the user
            req.session.user = {
                userId: user.userid,
                email: user.email,
                type: user.type
            };
            await req.session.save(); // Save session
            console.log(req.session)
            res.json({ message: 'Login successful' });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Middleware to require employee authentication
function requireEmployeeAuth(req, res, next) {
    console.log(req.session)
    if (req.session && req.session.user && req.session.user.type === 'W') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}
const requireUserAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        // Jeœli u¿ytkownik jest zalogowany, przejdŸ do kolejnej funkcji middleware
        next();
    } else {
        // Jeœli u¿ytkownik nie jest zalogowany, zwróæ b³¹d 401 Unauthorized
        res.status(401).json({ error: 'Unauthorized' });
    }
};
// Endpoint do pobierania adresu zalogowanego u¿ytkownika
app.get('/user/address', requireUserAuth, async (req, res) => {
    const userId = req.session.user.userId;
    try {
        // Query to get user's address
        const queryResult = await pool.query(
            'SELECT a.* FROM addresses a INNER JOIN users u ON a.addressid = u.addressid WHERE u.userid = $1',
            [userId]
        );

        // Check if user has an address
        if (queryResult.rows.length === 0) {
            return res.status(404).json({ error: 'User address not found' });
        }

        // Return user's address
        res.json(queryResult.rows[0]);
    } catch (error) {
        console.error('Error fetching user address:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Worker registration endpoint
app.post('/register/worker', requireEmployeeAuth, async (req, res) => {
    const { firstname, lastname, email, password, phonenumber, type } = req.body;

    try {
        // Check if the email already exists in the database
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new worker into the database
        const queryResult = await pool.query(
            'INSERT INTO users (firstname, lastname, email, password, phonenumber, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [firstname, lastname, email, hashedPassword, phonenumber, type]
        );

        res.status(201).json(queryResult.rows[0]);
    } catch (error) {
        console.error('Worker registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Handling POST request to add a new order
app.post('/orders', async (req, res) => {
    const { userid, items, orderstatus } = req.body;
    const orderdate = new Date(); // Current date and time

    try {
        // Insert new order into the database
        const orderQueryResult = await pool.query(
            'INSERT INTO orders (userid, orderdate, orderstatus) VALUES ($1, $2, $3) RETURNING orderid',
            [userid, orderdate, orderstatus]
        );
        const orderId = orderQueryResult.rows[0].orderid;

        // Insert items (products and extras) into the product_extras_to_order table
        const insertPromises = items.map(async (item) => {
            const { productid, extras, reciptprice } = item;
            // Insert product into the product_extras_to_order table
            await pool.query(
                'INSERT INTO product_extras_to_order (orderid, productid, reciptprice) VALUES ($1, $2, $3)',
                [orderId, productid, reciptprice]
            );
            // Insert extras into the product_extras_to_order table
            if (extras && extras.length > 0) {
                for (const extra of extras) {
                    await pool.query(
                        'INSERT INTO product_extras_to_order (orderid, productid, extrasid, reciptprice) VALUES ($1, $2, $3, $4)',
                        [orderId, productid, extra.extrasid, extra.reciptprice]
                    );
                }
            }
        });

        // Wait for all insert operations to complete
        await Promise.all(insertPromises);

        res.status(201).json({ message: 'Order added successfully' });
    } catch (error) {
        console.error('Error adding order:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Handling GET request to retrieve orders with products and extras
app.get('/orders', async (req, res) => {
    try {
        // Query database to get orders information
        const ordersQueryResult = await pool.query(
            'SELECT o.orderid, o.userid, o.orderdate, o.quantity, o.wholeprice, o.orderstatus, ' +
            'p.productid, p.name AS product_name, p.description AS product_description, p.productprice, ' +
            'e.extrasid, e.name AS extras_name, e.extrasprice ' +
            'FROM orders o ' +
            'LEFT JOIN product_extras_to_order pe ON o.orderid = pe.orderid ' +
            'LEFT JOIN products p ON pe.productid = p.productid ' +
            'LEFT JOIN extras e ON pe.extrasid = e.extrasid'
        );

        // Process the query result to format it as needed
        // (grouping orders, products, and extras together)

        // Return orders information with products and extras as response
        res.json(ordersQueryResult.rows);
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Handling PUT request to update order status
app.put('/orders/:orderid/status', requireEmployeeAuth, async (req, res) => {
    const orderId = req.params.orderid;
    const { orderstatus } = req.body;

    try {
        // Update order status in the database
        const queryResult = await pool.query(
            'UPDATE orders SET orderstatus = $1 WHERE orderid = $2 RETURNING *',
            [orderstatus, orderId]
        );

        if (queryResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json(queryResult.rows[0]);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Handling GET request on /products endpoint
app.get('/products', async (req, res) => {
    console.log(req.session)
    try {
        // Query database to get product information
        const productsQueryResult = await pool.query('SELECT productid, name, description, productprice, productcategory, image FROM products');
        // Check if any products were returned
        if (productsQueryResult.rows.length === 0) {
            return res.status(404).json({ error: 'No products found' });
        }
        // Prepare array of products with information including images
        const products = productsQueryResult.rows;
        // Return product information as response
        res.json(products);
    } catch (error) {
        console.error('Query error', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// Handling GET request to retrieve extras
app.get('/extras', async (req, res) => {
    try {
        // Query database to get extras information
        const extrasQueryResult = await pool.query('SELECT * FROM extras');

        if (extrasQueryResult.rows.length === 0) {
            return res.status(404).json({ error: 'No extras found' });
        }

        // Return extras information as response
        res.json(extrasQueryResult.rows);
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// Endpoint do pobierania dodatków o danym typie
app.get('/extras/:extrascategory', async (req, res) => {
    const { extrascategory } = req.params;

    try {
        // Wykonaj zapytanie do bazy danych, aby pobraæ dodatki o danym typie
        const queryResult = await pool.query(
            'SELECT * FROM public.extras WHERE extrascategory = $1',
            [extrascategory]
        );

        // SprawdŸ, czy znaleziono jakieœ dodatki
        if (queryResult.rows.length === 0) {
            return res.status(404).json({ error: 'No extras found for the given category' });
        }

        // Zwróæ znalezione dodatki
        res.json(queryResult.rows);
    } catch (error) {
        console.error('Error fetching extras:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.put('/extras/:extrasId', async (req, res) => {
    const { extrasId } = req.params;
    const { name, extrasprice, extrascategory } = req.body;

    try {
        // SprawdŸ, czy dodatek o podanym ID istnieje
        const existingExtra = await pool.query('SELECT * FROM extras WHERE extrasid = $1', [extrasId]);
        if (existingExtra.rows.length === 0) {
            return res.status(404).json({ error: 'Extra not found' });
        }

        // Zaktualizuj dodatek o podanym ID
        const queryResult = await pool.query(
            'UPDATE extras SET name = $1, extrasprice = $2, extrascategory = $3 WHERE extrasid = $4 RETURNING *',
            [name, extrasprice, extrascategory, extrasId]
        );

        // Zwróæ zaktualizowany dodatek
        res.json(queryResult.rows[0]);
    } catch (error) {
        console.error('Error updating extra:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Handling POST request on /products endpoint
app.post('/products', requireEmployeeAuth, async (req, res) => {
    const { name, description, productprice, productcategory } = req.body;
    const image = req.file ? req.file.buffer : null; // Get image data from form
    try {
        let resizedImageBuffer = null;
        if (image) {
            // Resize the image to 256x256
            resizedImageBuffer = await sharp(image)
                .resize({ width: 256, height: 256 })
                .toBuffer();
        }
        // Query database to add a new product
        const queryResult = await pool.query(
            'INSERT INTO products (name, description, productprice, productcategory, image) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, productprice, productcategory, resizedImageBuffer]
        );
        // Return the added product as response
        res.status(201).json(queryResult.rows[0]);
    } catch (error) {
        console.error('Error adding product ', name, error);
        res.status(500).json({ error: 'Server error' });
    }
});
app.put('/products/:productId', requireEmployeeAuth, async (req, res) => {
    const { productId } = req.params;
    const { name, description, productprice, productcategory } = req.body;
    const image = req.file ? req.file.buffer : null; // Get image data from form

    try {
        let resizedImageBuffer = null;
        if (image) {
            // Resize the image to 256x256
            resizedImageBuffer = await sharp(image)
                .resize({ width: 256, height: 256 })
                .toBuffer();
        }

        // Query to update product
        const queryResult = await pool.query(
            'UPDATE products SET name = $1, description = $2, productprice = $3, productcategory = $4, image = $5 WHERE productid = $6 RETURNING *',
            [name, description, productprice, productcategory, resizedImageBuffer, productId]
        );

        // Check if product with given ID exists
        if (queryResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Return updated product
        res.json(queryResult.rows[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


// Handling DELETE request on /products/:productId endpoint
app.delete('/products/:productId', requireEmployeeAuth, async (req, res) => {
    const productId = req.params.productId;
    console.log("uda³o siê")
    //try {
        // Execute query to delete product with given id
        //await pool.query('DELETE FROM products WHERE productid = $1', [productId]);
        //res.status(204).send(); // Return 204 No Content status on success
    //} catch (error) {
        //console.error('Error deleting product ', error);
       //res.status(500).json({ error: 'Server error' });
   // }
});
app.post('/inventory', requireEmployeeAuth, async (req, res) => {
    const { itemname, itemquantity } = req.body;

    try {
        // Query to add item to inventory
        const queryResult = await pool.query(
            'INSERT INTO inventory (itemname, itemquantity) VALUES ($1, $2) RETURNING *',
            [itemname, itemquantity]
        );

        // Return added item
        res.status(201).json(queryResult.rows[0]);
    } catch (error) {
        console.error('Error adding item to inventory:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
app.delete('/inventory/:inventoryId', requireEmployeeAuth, async (req, res) => {
    const { inventoryId } = req.params;

    try {
        // Query to delete item from inventory
        const queryResult = await pool.query(
            'DELETE FROM inventory WHERE inventoryid = $1 RETURNING *',
            [inventoryId]
        );

        // Check if item with given ID exists
        if (queryResult.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found in inventory' });
        }

        // Return deleted item
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item from inventory:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
app.put('/inventory/:inventoryId', requireEmployeeAuth, async (req, res) => {
    const { inventoryId } = req.params;
    const { itemquantity } = req.body;

    try {
        // Query to update item quantity in inventory
        const queryResult = await pool.query(
            'UPDATE inventory SET itemquantity = $1 WHERE inventoryid = $2 RETURNING *',
            [itemquantity, inventoryId]
        );

        // Check if item with given ID exists
        if (queryResult.rows.length === 0) {
            return res.status(404).json({ error: 'Item not found in inventory' });
        }

        // Return updated item
        res.json(queryResult.rows[0]);
    } catch (error) {
        console.error('Error updating item quantity in inventory:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
app.get('/inventory', requireEmployeeAuth, async (req, res) => {
    try {
        // Query to get all items from inventory
        const queryResult = await pool.query('SELECT * FROM inventory');

        // Check if inventory is empty
        if (queryResult.rows.length === 0) {
            return res.status(404).json({ error: 'Inventory is empty' });
        }

        // Return all items from inventory
        res.json(queryResult.rows);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
app.post('/user/address', requireUserAuth, async (req, res) => {
    const { street, buildingnumber, apartmentnumber, city, postalcode } = req.body;
    const userId = req.session.user.userId;

    try {
        // Dodanie nowego adresu do tabeli addresses
        const queryResult = await pool.query(
            'INSERT INTO addresses (street, buildingnumber, apartmentnumber, city, postalcode) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [street, buildingnumber, apartmentnumber, city, postalcode]
        );

        // Pobranie ID dodanego adresu
        const addressId = queryResult.rows[0].addressid;

        // Aktualizacja adresu u¿ytkownika w tabeli users
        await pool.query(
            'UPDATE users SET addressid = $1 WHERE userid = $2',
            [addressId, userId]
        );

        res.status(201).json({ message: 'Address added successfully' });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
app.put('/user/address', requireUserAuth, async (req, res) => {
    const { street, buildingnumber, apartmentnumber, city, postalcode } = req.body;
    const userId = req.session.user.userId;

    try {
        // Pobranie ID adresu u¿ytkownika z tabeli users
        const userQueryResult = await pool.query(
            'SELECT addressid FROM users WHERE userid = $1',
            [userId]
        );

        // Sprawdzenie, czy u¿ytkownik ma przypisany adres
        if (userQueryResult.rows.length === 0) {
            return res.status(404).json({ error: 'User address not found' });
        }

        const addressId = userQueryResult.rows[0].addressid;

        // Aktualizacja danych adresowych w tabeli addresses
        await pool.query(
            'UPDATE addresses SET street = $1, buildingnumber = $2, apartmentnumber = $3, city = $4, postalcode = $5 WHERE addressid = $6',
            [street, buildingnumber, apartmentnumber, city, postalcode, addressId]
        );

        res.json({ message: 'Address updated successfully' });
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
app.delete('/user/address', requireUserAuth, async (req, res) => {
    const userId = req.session.user.userId;

    try {
        // Pobranie ID adresu u¿ytkownika z tabeli users
        const userQueryResult = await pool.query(
            'SELECT addressid FROM users WHERE userid = $1',
            [userId]
        );

        // Sprawdzenie, czy u¿ytkownik ma przypisany adres
        if (userQueryResult.rows.length === 0) {
            return res.status(404).json({ error: 'User address not found' });
        }

        const addressId = userQueryResult.rows[0].addressid;

        // Usuniêcie adresu z tabeli addresses
        await pool.query(
            'DELETE FROM addresses WHERE addressid = $1',
            [addressId]
        );

        // Usuniêcie referencji do adresu w tabeli users
        await pool.query(
            'UPDATE users SET addressid = NULL WHERE userid = $1',
            [userId]
        );

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Handling GET request on root endpoint
app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start listening on the defined port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
