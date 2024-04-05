const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const upload = multer();
const cors = require('cors'); // Add cors import
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
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
    secret: 'unique_random_secret_value',
    resave: false,
    saveUninitialized: true,
    name: 'cookie_name',
    cookie: {
        secure: false,
    }
}));

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
        if (password === user.password) {
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

// Handling POST request on /products endpoint
app.post('/products', requireEmployeeAuth, async (req, res) => {
    const { name, description, productprice, productcategory } = req.body;
    const image = req.file ? req.file.buffer : null; // Get image data from form
    try {
        // Query database to add a new product
        const queryResult = await pool.query(
            'INSERT INTO products (name, description, productprice, productcategory, image) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, productprice, productcategory, image]
        );
        // Return the added product as response
        res.status(201).json(queryResult.rows[0]);
    } catch (error) {
        console.error('Error adding product ', name, error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Handling DELETE request on /products/:productId endpoint
app.delete('/products/:productId', async (req, res) => {
    const productId = req.params.productId;
    try {
        // Execute query to delete product with given id
        await pool.query('DELETE FROM products WHERE productid = $1', [productId]);
        res.status(204).send(); // Return 204 No Content status on success
    } catch (error) {
        console.error('Error deleting product ', error);
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
