import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import routes from './routes/index.js';
import errorHandler from './controller/errorController.js';


// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5500;

app.use(express.json());
app.use(cors({
  origin: '*'
}));

app.use('/api', routes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Define a simple route
app.get('/', (req, res) => {
  res.send('MOGU Node.js server is running!');
});

app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

