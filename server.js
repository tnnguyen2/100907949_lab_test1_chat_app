const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const User = require('./models/userModel');
const Message = require('./models/messageModel');
const bodyParser = require("body-parser");
const PrivateMessage = require('./models/privateMessageModel');
const cors = require('cors');

// App setup
const app = express();
app.use(express.static('views'));

// MongoDB connection
const DB_HOST = "@cluster0.hgh3k7b.mongodb.net";
const DB_USER = "tdotnguyen";
const DB_PASSWORD = "JA5Dkz4KLhZMBsTC";
const DB_NAME = "Lab_Test1";
const DB_CONNECTION = `mongodb+srv://${DB_USER}:${DB_PASSWORD}${DB_HOST}/${DB_NAME}?retryWrites=true&w=majority`
mongoose.connect(DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Successful Mongodb connection')
}).catch(err => {
    console.log('Error Mongodb connection',err)
});

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.post('/signup', async (req, res) => {
    try {
        const { username, password, firstname, lastname } = req.body;
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const newUser = new User({ username, password, firstname, lastname});
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/chat', async (req, res) => {
    try {
        const { username, room, message } = req.body;

        if (!['devops', 'cloud', 'covid19', 'sports', 'nodeJS'].includes(room)) {
            return res.status(400).json({ message: 'Invalid room' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        const newMessage = new Message({ username, room, message });
        await newMessage.save();
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/privateChat', async (req, res) => {
    try {
        const { sender, receiver, message } = req.body;

        // Check if the sender exists
        const senderExists = await User.exists({ username: sender });
        if (!senderExists) {
            return res.status(400).json({ message: 'Sender does not exist' });
        }

        // Check if the receiver exists
        const receiverExists = await User.exists({ username: receiver });
        if (!receiverExists) {
            return res.status(400).json({ message: 'Receiver does not exist' });
        }

        // Both sender and receiver exist, save the private message
        const newMessage = new PrivateMessage({ sender, receiver, message });
        await newMessage.save();
        return res.status(201).json({ message: 'Private message sent successfully' });
    } catch (error) {
        console.error('Error sending private message:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


app.get('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne ({ username, password }).select('username firstname lastname');

    if (user) {
        res.status(200).send(user);
    } else {
        res.status(401).send('Invalid username or password');
    }
});
app.get('/privateChat/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // Find all messages where the user is the sender
        const sentMessages = await PrivateMessage.find({ sender: username });

        // Find all messages where the user is the receiver
        const receivedMessages = await PrivateMessage.find({ receiver: username });

        // Combine sent and received messages into a single array
        const allMessages = [...sentMessages, ...receivedMessages];

        res.status(200).json(allMessages);
    } catch (error) {
        console.error('Error retrieving private chats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/chat/:room', async (req, res) => {
    try {
        const { room } = req.params; // Use req.params to access the room parameter
        // Find messages by room
        const messages = await Message.find({ room });

        // If there are no messages found, return a 404 Not Found status
        if (!messages || messages.length === 0) {
            return res.status(404).json({ message: 'No Messages or Room does not exist' });
        }

        // If messages are found, return them with a 200 OK status
        return res.status(200).json(messages);
    } catch (error) {
        // If there's an error, return a 500 Internal Server Error status
        console.error('Error retrieving messages:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
app.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('username firstname lastname');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


//Start server
const SERVER_PORT = process.env.PORT || 3000;
app.listen(SERVER_PORT, () => {
    console.log(`Server started at http://localhost:${SERVER_PORT}/`);
})



