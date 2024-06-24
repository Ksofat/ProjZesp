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

const path = require('path');

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

// Serve static files from the 'public' directory
app.use(express.static('public'));

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
app.post('/api/register', async (req, res) => {
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
app.post('/api/login', async (req, res) => {
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
    if (req.session && req.session.user && req.session.user.type === 'W' || req.session.user.type === 'M') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

const requireUserAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        // Je�li u�ytkownik jest zalogowany, przejd� do kolejnej funkcji middleware
        next();
    } else {
        // Je�li u�ytkownik nie jest zalogowany, zwr�� b��d 401 Unauthorized
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Endpoint do pobierania adresu zalogowanego u�ytkownika
app.get('/api/user/address', requireUserAuth, async (req, res) => {
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

// Handling POST request to add a new order
app.post('/api/user/orders', requireUserAuth, async (req, res) => {
    const userid = req.session.user.userId;
    const { items, orderstatus, wholeprice, is_take_out } = req.body;
    const orderdate = new Date(); // Current date and time

    try {
        // Insert new order into the database
        const orderQueryResult = await pool.query(
            'INSERT INTO orders (userid, orderdate, orderstatus, wholeprice, is_take_out) VALUES ($1, $2, $3, $4, $5) RETURNING orderid',
            [userid, orderdate, orderstatus, wholeprice, is_take_out]
        );
        const orderId = orderQueryResult.rows[0].orderid;

        // Insert products and extras into the product_extras_to_order table
        const insertPromises = items.map(async (item) => {
            const { productid, extras, price } = item;
            // Ensure productid is not null
            if (!productid) {
                throw new Error('Product ID is missing');
            }
            // Insert product into product_extras_to_order table
            await pool.query(
                'INSERT INTO product_extras_to_order (orderid, productid, reciptprice) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [orderId, productid, price]
            );
            // Insert extras into product_extras_to_order table
            if (extras && extras.length > 0) {
                for (const extra of extras) {
                    await pool.query(
                        'INSERT INTO product_extras_to_order (orderid, productid, extrasid, reciptprice) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
                        [orderId, productid, extra.id, extra.price]
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

// Handling GET request on /products endpoint
app.get('/api/products', async (req, res) => {
    console.log(req.session)
    try {
        // Query database to get product information
        const productsQueryResult = await pool.query('SELECT productid, name, description, productprice, productcategory, image, is_locked FROM products');
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
app.get('/api/extras', async (req, res) => {
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

app.put('/api/extras/id/:extrasId', async (req, res) => {
    const { extrasId } = req.params;
    const { name, extrasprice, extrascategory } = req.body;

    try {
        // Sprawd�, czy dodatek o podanym ID istnieje
        const existingExtra = await pool.query('SELECT * FROM extras WHERE extrasid = $1', [extrasId]);
        if (existingExtra.rows.length === 0) {
            return res.status(404).json({ error: 'Extra not found' });
        }

        // Zaktualizuj dodatek o podanym ID
        const queryResult = await pool.query(
            'UPDATE extras SET name = $1, extrasprice = $2, extrascategory = $3 WHERE extrasid = $4 RETURNING *',
            [name, extrasprice, extrascategory, extrasId]
        );

        // Zwr�� zaktualizowany dodatek
        res.json(queryResult.rows[0]);
    } catch (error) {
        console.error('Error updating extra:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Handling POST request on /products endpoint
app.post('/api/products', requireEmployeeAuth, async (req, res) => {
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

app.put('/api/products/:productId', requireEmployeeAuth, async (req, res) => {
    const { productId } = req.params;
    const { name, description, productprice, productcategory, is_locked } = req.body;
    const image = req.file ? req.file.buffer : null; // Get image data from form

    try {
        let resizedImageBuffer = null;
        if (image) {
            // Resize the image to 256x256
            resizedImageBuffer = await sharp(image)
                .resize({ width: 256, height: 256 })
                .toBuffer();
        } else {
            // Fetch existing image if new one isn't provided
            const existingProduct = await pool.query('SELECT image FROM products WHERE productid = $1', [productId]);
            resizedImageBuffer = existingProduct.rows[0].image;
        }

        // Query to update product
        const queryResult = await pool.query(
            'UPDATE products SET name = $1, description = $2, productprice = $3, productcategory = $4, image = $5, is_locked = $6 WHERE productid = $7 RETURNING *',
            [name, description, productprice, productcategory, resizedImageBuffer, is_locked, productId]
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
app.delete('/api/products/:productId', async (req, res) => {
    const { productId } = req.params;
    try {
        // Logic to delete product from database
        const deleteResult = await pool.query('DELETE FROM products WHERE productid = $1', [productId]);
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(204).send(); // Return 204 No Content status on success
    } catch (error) {
        console.error('Error deleting product', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/user/address', requireUserAuth, async (req, res) => {
    const { street, buildingnumber, apartmentnumber, city, postalcode } = req.body;
    const userId = req.session.user.userId;

    try {
        // Pobranie ID adresu u�ytkownika z tabeli users
        const userQueryResult = await pool.query(
            'SELECT addressid FROM users WHERE userid = $1',
            [userId]
        );

        // Sprawdzenie, czy u�ytkownik ma przypisany adres
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

// Handling GET request on root endpoint
app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start listening on the defined port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// NEW

// Handling GET request on /products/available endpoint
app.get('/api/products/available', async (req, res) => {
    console.log(req.session)
    try {
        // Query database to get product information
        const productsQueryResult = await pool.query('SELECT productid, name, description, productprice, productcategory, image FROM products WHERE is_locked IS NOT TRUE');
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

// Handling GET request on /products/locked endpoint
app.get('/api/products/locked', async (req, res) => {
    console.log(req.session)
    try {
        // Query database to get product information
        const productsQueryResult = await pool.query('SELECT productid, name, description, productprice, productcategory, image FROM products WHERE is_locked IS TRUE');
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

// Endpoint to get a product by ID
app.get('/api/products/:productId', async (req, res) => {
    const { productId } = req.params;
    try {
        const productQueryResult = await pool.query('SELECT * FROM products WHERE productid = $1', [productId]);
        if (productQueryResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(productQueryResult.rows[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint to get product categories
app.get('/api/products/categories/all', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT productcategory FROM products ORDER BY productcategory');
        const categories = result.rows.map(row => ({ name: row.productcategory }));
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint to get product categories
app.get('/api/products/categories/available', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT productcategory FROM products WHERE is_locked IS NOT TRUE ORDER BY productcategory');
        const categories = result.rows.map(row => ({ name: row.productcategory }));
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint to get product categories
app.get('/api/products/categories/locked', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT productcategory FROM products WHERE is_locked IS TRUE ORDER BY productcategory');
        const categories = result.rows.map(row => ({ name: row.productcategory }));
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST endpoint to insert new extras
app.post('/api/extras', async (req, res) => {
    const { name, extrasprice, extrascategory } = req.body;

    try {
        // Insert new extra into the database
        const queryResult = await pool.query(
            'INSERT INTO extras (name, extrasprice, extrascategory) VALUES ($1, $2, $3) RETURNING *',
            [name, extrasprice, extrascategory]
        );

        // Return the newly added extra
        res.status(201).json(queryResult.rows[0]);
    } catch (error) {
        console.error('Error adding new extra:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to get extras by ID
app.get('/api/extras/id/:extrasId', async (req, res) => {
    const { extrasId } = req.params;
    try {
        const queryResult = await pool.query('SELECT * FROM extras WHERE extrasid = $1', [extrasId]);
        if (queryResult.rows.length === 0) {
            return res.status(404).json({ error: 'Extra not found' });
        }
        res.json(queryResult.rows[0]);
    } catch (error) {
        console.error('Error fetching extra:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE endpoint to remove an extra by ID
app.delete('/api/extras/id/:extrasId', async (req, res) => {
    const { extrasId } = req.params;

    try {
        // Query to delete the extra from the database
        const deleteResult = await pool.query('DELETE FROM extras WHERE extrasid = $1', [extrasId]);

        // Check if the delete operation affected any rows
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ error: 'Extra not found' });
        }

        // Return a success response
        res.status(204).send(); // 204 No Content is appropriate for a successful DELETE request that returns no content
    } catch (error) {
        console.error('Error deleting extra:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Handling GET request on /users endpoint
app.get('/api/users', async (req, res) => {
    try {
        // Query database to get user information
        const usersQueryResult = await pool.query('SELECT userid, firstname, lastname, email, phonenumber, type, addressid FROM users');
        // Check if any users were returned
        if (usersQueryResult.rows.length === 0) {
            return res.status(404).json({ error: 'No users found' });
        }
        // Prepare array of users with information
        const users = usersQueryResult.rows;
        // Return user information as response
        res.json(users);
    } catch (error) {
        console.error('Query error', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Handling GET all managers endpoint
app.get('/api/managers', async (req, res) => {
    try {
        // Query database to get user information
        const usersQueryResult = await pool.query('SELECT userid, firstname, lastname, email, phonenumber, type, addressid FROM users WHERE type = $1', ['M']);
        // Check if any users were returned
        if (usersQueryResult.rows.length === 0) {
            return res.status(404).json({ error: 'No users found' });
        }
        // Prepare array of users with information
        const users = usersQueryResult.rows;
        // Return user information as response
        res.json(users);
    } catch (error) {
        console.error('Query error', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Handling GET request on workers endpoint
app.get('/api/workers', async (req, res) => {
    try {
        // Query database to get user information
        const usersQueryResult = await pool.query('SELECT userid, firstname, lastname, email, phonenumber, type, addressid FROM users WHERE type = $1', ['W']);
        // Check if any users were returned
        if (usersQueryResult.rows.length === 0) {
            return res.status(404).json({ error: 'No users found' });
        }
        // Prepare array of users with information
        const users = usersQueryResult.rows;
        // Return user information as response
        res.json(users);
    } catch (error) {
        console.error('Query error', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Handling POST request on /users endpoint
app.post('/api/users', async (req, res) => {
    const { firstname, lastname, email, phonenumber, password, type } = req.body;

    try {
        // Check if the email already exists in the database
        const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const queryText = 'INSERT INTO users (firstname, lastname, email, password, phonenumber, type) VALUES ($1, $2, $3, $4, $5, $6)';
        const queryValues = [firstname, lastname, email, hashedPassword, phonenumber, type];

        await pool.query(queryText, queryValues);

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error inserting user:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Handling PUT request to update user details
app.put('/api/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const { firstname, lastname, email, phonenumber, password, type } = req.body;
    let updateQuery = 'UPDATE users SET firstname = $1, lastname = $2, email = $3, phonenumber = $4, type = $5 WHERE userid = $6 RETURNING *';
    let queryParams = [firstname, lastname, email, phonenumber, type, userId];

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash new password
        updateQuery = 'UPDATE users SET firstname = $1, lastname = $2, email = $3, phonenumber = $4, password = $5, type = $6 WHERE userid = $7 RETURNING *';
        queryParams = [firstname, lastname, email, phonenumber, hashedPassword, type, userId];
    }

    try {
        const updateResult = await pool.query(updateQuery, queryParams);
        if (updateResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(updateResult.rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Handling DELETE request on /users endpoint
app.delete('/api/users/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Logic to delete user from database
        const deleteResult = await pool.query('DELETE FROM users WHERE userid = $1', [userId]);
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(204).send(); // Return 204 No Content status on success
    } catch (error) {
        console.error('Error deleting user', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint to get statistics for each product with optional date filtering
app.get('/api/stats/products', async (req, res) => {
    const { startDate, endDate } = req.query;
    let query = `
        SELECT p.name, COUNT(pe.productid) AS order_count
        FROM products p
        JOIN product_extras_to_order pe ON p.productid = pe.productid
        JOIN orders o ON pe.orderid = o.orderid
    `;

    let queryParams = [];
    if (startDate && endDate) {
        query += ' WHERE o.orderdate BETWEEN $1 AND $2';
        queryParams.push(startDate, endDate);
    }

    query += ' GROUP BY p.name';

    try {
        const queryResult = await pool.query(query, queryParams);
        res.json(queryResult.rows);
    } catch (error) {
        console.error('Error fetching product statistics:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint to get statistics for each extra with optional date filtering
app.get('/api/stats/extras', async (req, res) => {
    const { startDate, endDate } = req.query;
    let query = `
        SELECT e.name, COUNT(pe.extrasid) AS order_count
        FROM extras e
        JOIN product_extras_to_order pe ON e.extrasid = pe.extrasid
        JOIN orders o ON pe.orderid = o.orderid
    `;

    let queryParams = [];
    if (startDate && endDate) {
        query += ' WHERE o.orderdate BETWEEN $1 AND $2';
        queryParams.push(startDate, endDate);
    }

    query += ' GROUP BY e.name';

    try {
        const queryResult = await pool.query(query, queryParams);
        res.json(queryResult.rows);
    } catch (error) {
        console.error('Error fetching extra statistics:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint to get total number of orders
app.get('/api/stats/total-orders', async (req, res) => {
    try {
        const queryResult = await pool.query(
            'SELECT COUNT(*) AS total_orders FROM orders'
        );
        res.json(queryResult.rows[0]);
    } catch (error) {
        console.error('Error fetching total orders:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint to get statistics for order count per month
app.get('/api/stats/orders/monthly', async (req, res) => {
    try {
        const queryResult = await pool.query(
            `SELECT TO_CHAR(orderdate, 'YYYY-MM') as month, COUNT(*) AS total_orders
             FROM orders
             GROUP BY TO_CHAR(orderdate, 'YYYY-MM')
             ORDER BY month`
        );
        res.json(queryResult.rows);
    } catch (error) {
        console.error('Error fetching monthly order statistics:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Endpoint to get a user by ID
app.get('/api/users/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const userQueryResult = await pool.query('SELECT * FROM users WHERE userid = $1', [userId]);
        if (userQueryResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(userQueryResult.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user phone number using PATCH for partial updates
app.patch('/api/users/:userId/phone', requireUserAuth, async (req, res) => {
    const { userId } = req.params;
    const { phonenumber } = req.body;

    // Basic validation for phone number
    if (!phonenumber || !/^\d{9}$/.test(phonenumber)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
    }

    try {
        const updateResult = await pool.query(
            'UPDATE users SET phonenumber = $1 WHERE userid = $2 RETURNING *',
            [phonenumber, userId]
        );
        if (updateResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(updateResult.rows[0]);
    } catch (error) {
        console.error('Error updating phone number:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.patch('/api/users/:userId/password', requireUserAuth, async (req, res) => {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await pool.query('SELECT password FROM users WHERE userid = $1', [userId]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
        if (!validPassword) {
            return res.status(403).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE userid = $2', [hashedPassword, userId]);
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user address using PATCH for partial updates or create a new one if none exists
app.patch('/api/user/address', requireUserAuth, async (req, res) => {
    const { street, buildingnumber, apartmentnumber, city, postalcode } = req.body;
    const userId = req.session.user.userId;

    try {
        // Retrieve the user's current address ID
        const userQueryResult = await pool.query(
            'SELECT addressid FROM users WHERE userid = $1',
            [userId]
        );

        if (userQueryResult.rows.length > 0 && userQueryResult.rows[0].addressid) {
            const addressId = userQueryResult.rows[0].addressid;

            // Update the existing address details
            await pool.query(
                'UPDATE addresses SET street = $1, buildingnumber = $2, apartmentnumber = $3, city = $4, postalcode = $5 WHERE addressid = $6',
                [street, buildingnumber, apartmentnumber, city, postalcode, addressId]
            );

            res.json({ message: 'Address updated successfully' });
        } else {
            // No address found, create a new one
            const insertResult = await pool.query(
                'INSERT INTO addresses (street, buildingnumber, apartmentnumber, city, postalcode) VALUES ($1, $2, $3, $4, $5) RETURNING addressid',
                [street, buildingnumber, apartmentnumber, city, postalcode]
            );

            const newAddressId = insertResult.rows[0].addressid;

            // Update user's address ID
            await pool.query(
                'UPDATE users SET addressid = $1 WHERE userid = $2',
                [newAddressId, userId]
            );

            res.status(201).json({ message: 'New address added and linked to user successfully' });
        }
    } catch (error) {
        console.error('Error updating or adding address:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Handling GET request to retrieve orders for the logged-in user with products and extras
app.get('/api/user/orders', requireUserAuth, async (req, res) => {
    const userId = req.session.user.userId; // Get user ID from session
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 7));

    try {
        // Query database to get orders information for the logged-in user
        const ordersQueryResult = await pool.query(
            `SELECT o.orderid, o.userid, o.orderdate, o.wholeprice, o.orderstatus, 
            p.productid, p.name AS product_name, p.description AS product_description, p.productprice, 
            e.extrasid, e.name AS extras_name, e.extrasprice 
            FROM orders o 
            LEFT JOIN product_extras_to_order pe ON o.orderid = pe.orderid 
            LEFT JOIN products p ON pe.productid = p.productid 
            LEFT JOIN extras e ON pe.extrasid = e.extrasid
            WHERE o.userid = $1
            ORDER BY o.orderdate DESC`,
            [userId]
        );

        // Process the query result to format it as needed
        const orders = ordersQueryResult.rows.reduce((acc, item) => {
            // Initialize order if not already present
            if (!acc[item.orderid]) {
                acc[item.orderid] = {
                    orderid: item.orderid,
                    userid: item.userid,
                    orderdate: item.orderdate,
                    wholeprice: item.wholeprice,
                    orderstatus: item.orderstatus,
                    products: []
                };
            }

            // Add product and extras to the order
            if (item.productid && !acc[item.orderid].products.some(p => p.productid === item.productid)) {
                acc[item.orderid].products.push({
                    productid: item.productid,
                    product_name: item.product_name,
                    product_description: item.product_description,
                    productprice: item.productprice,
                    extras: []
                });
            }

            // Add extras to the product
            if (item.extrasid) {
                const product = acc[item.orderid].products.find(p => p.productid === item.productid);
                if (product && !product.extras.some(e => e.extrasid === item.extrasid)) {
                    product.extras.push({
                        extrasid: item.extrasid,
                        extras_name: item.extras_name,
                        extrasprice: item.extrasprice
                    });
                }
            }

            return acc;
        }, {});

        // Categorize orders into recent and older
        const categorizedOrders = {
            recentOrders: [],
            olderOrders: []
        };

        Object.values(orders).forEach(order => {
            if (new Date(order.orderdate) >= sevenDaysAgo) {
                categorizedOrders.recentOrders.push(order);
            } else {
                categorizedOrders.olderOrders.push(order);
            }
        });

        // Return orders information with products and extras as response
        res.json(categorizedOrders);
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to check if the user is logged in
app.get('/api/is-logged-in', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ isLoggedIn: true, type: req.session.user.type });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// Endpoint to get current user's ID
app.get('/api/get-user-id', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ userId: req.session.user.userId });
    } else {
        res.status(401).json({ error: 'User not logged in' });
    }
});

// Logout route
app.post('/api/logout', (req, res) => {
    if (req.session) {
        // Destroy the session
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({ error: 'Failed to logout' });
            }
            res.clearCookie('11ciastko11'); // Clear the session cookie if set
            res.json({ message: 'Logged out successfully' });
        });
    } else {
        res.status(200).json({ message: 'No session to logout' });
    }
});

app.get('/manager/products', (req, res) => {
    if (req.session && req.session.user && req.session.user.type === 'M') {
        res.sendFile(path.join(__dirname, 'public/manager/products.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/manager/staff', (req, res) => {
    if (req.session && req.session.user && req.session.user.type === 'M') {
        res.sendFile(path.join(__dirname, 'public/manager/staff.html'));
    } else {
        res.redirect('/');
    }
});

app.get('/manager/sales', (req, res) => {
    if (req.session && req.session.user && req.session.user.type === 'M') {
        res.sendFile(path.join(__dirname, 'public/manager/sales.html'));
    } else {
        res.redirect('/');
    }
});

// Route to serve the Profile page for logged-in users
app.get('/profile', (req, res) => {
    if (req.session && req.session.user) {
        res.sendFile(path.join(__dirname, 'public/profile.html'));
    } else {
        res.redirect('/');
    }
});

// Route to serve the Profile page for logged-in users
app.get('/checkout', (req, res) => {
    if (req.session && req.session.user) {
        res.sendFile(path.join(__dirname, 'public/checkout.html'));
    } else {
        res.redirect('/');
    }
});