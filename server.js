const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from current directory

// MongoDB connection with proper settings
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds instead of 10
    heartbeatFrequencyMS: 2000, // Check connection every 2 seconds
    retryWrites: true,
    w: 'majority',
    dbName: 'bankingApp'
}).then(() => {
    console.log('Connected to MongoDB successfully');
}).catch((err) => {
    console.error('MongoDB connection error:', err.message);
});

// Handle MongoDB connection errors
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
});

// Error handler middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    accountNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, required: true, enum: ['deposit', 'withdraw'] },
    amount: { type: Number, required: true },
    balance: { type: Number, required: true },
    description: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// Signup endpoint with optimized database operations
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            console.log('Validation failed: Missing required fields');
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if email already exists - with timeout
        const existingUser = await User.findOne({ email }).maxTimeMS(5000);
        if (existingUser) {
            console.log('Email already exists:', email);
            return res.status(400).json({ error: 'email_exists' });
        }

        // Generate account number (simplified to reduce database queries)
        const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user with timeout
        const user = new User({
            name,
            email,
            accountNumber,
            password: hashedPassword
        });

        await user.save({ timeout: 5000 });
        console.log('User created successfully:', { email, accountNumber });

        res.status(201).json({ 
            message: 'User created successfully',
            accountNumber: accountNumber 
        });
    } catch (error) {
        console.error('Signup error:', error.message);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { accountNumber, password } = req.body;

        // Find user
        const user = await User.findOne({ accountNumber });
        if (!user) {
            return res.status(400).json({ message: 'Invalid account number or password' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid account number or password' });
        }

        res.json({
            message: 'Login successful',
            user: {
                name: user.name,
                accountNumber: user.accountNumber,
                balance: user.balance
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

// Get user profile
app.get('/api/profile/:accountNumber', async (req, res) => {
    try {
        const user = await User.findOne({ 
            accountNumber: req.params.accountNumber 
        }).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Get transactions endpoint
app.get('/api/transactions/:accountNumber', async (req, res) => {
    try {
        const { accountNumber } = req.params;

        // Find user
        const user = await User.findOne({ accountNumber });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get transactions for this user
        const transactions = await Transaction.find({ userId: user._id })
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(10); // Limit to last 10 transactions

        res.json({ transactions });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Transaction endpoint (deposit/withdraw)
app.post('/api/transaction', async (req, res) => {
    try {
        const { accountNumber, type, amount, description } = req.body;

        // Validate input
        if (!accountNumber || !type || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }

        // Find user
        const user = await User.findOne({ accountNumber });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if sufficient balance for withdrawal
        if (type === 'withdraw' && user.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Update balance
        const newBalance = type === 'deposit' 
            ? user.balance + amount 
            : user.balance - amount;

        // Create transaction
        const transaction = new Transaction({
            userId: user._id,
            type,
            amount,
            balance: newBalance,
            description
        });

        // Save transaction and update user balance
        await transaction.save();
        user.balance = newBalance;
        await user.save();

        res.json({ 
            message: 'Transaction successful',
            newBalance,
            transaction
        });
    } catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
