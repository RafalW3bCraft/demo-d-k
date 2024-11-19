import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Get current directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
const mongoURI = process.env.MONGO_URI || 'mongodb://username:password@mongodb:27017/rafalcraft?authSource=admin';

mongoose.connect(mongoURI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// Todo Schema
const TodoSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    description: String,
    completed: { 
        type: Boolean, 
        default: false 
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    dueDate: Date,
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Update the updatedAt timestamp before saving
TodoSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Todo = mongoose.model('Todo', TodoSchema);

// Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// Get all todos with filtering and sorting
app.get('/api/todos', async (req, res) => {
    try {
        const { status, priority, sort } = req.query;
        const filter = {};
        
        if (status === 'completed') filter.completed = true;
        if (status === 'active') filter.completed = false;
        if (priority) filter.priority = priority;

        let query = Todo.find(filter);

        // Sorting
        if (sort === 'dueDate') {
            query = query.sort({ dueDate: 1 });
        } else if (sort === 'priority') {
            query = query.sort({ priority: -1 });
        } else {
            query = query.sort({ createdAt: -1 });
        }

        const todos = await query.exec();
        res.json(todos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new todo
app.post('/api/todos', async (req, res) => {
    try {
        const todo = new Todo({
            title: req.body.title,
            description: req.body.description,
            priority: req.body.priority,
            dueDate: req.body.dueDate
        });
        const newTodo = await todo.save();
        res.status(201).json(newTodo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update todo
app.patch('/api/todos/:id', async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        if (req.body.hasOwnProperty('completed')) {
            todo.completed = req.body.completed;
        }
        if (req.body.title) todo.title = req.body.title;
        if (req.body.description) todo.description = req.body.description;
        if (req.body.priority) todo.priority = req.body.priority;
        if (req.body.dueDate) todo.dueDate = req.body.dueDate;

        const updatedTodo = await todo.save();
        res.json(updatedTodo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete todo
app.delete('/api/todos/:id', async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        await Todo.findByIdAndDelete(req.params.id);
        res.json({ message: 'Todo deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});