import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import url from 'url';
import loggerUtil from './utils/logger.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const dirname = path.resolve(__dirname, "./");

dotenv.config();

import routes from './routes/index.js';
import errorHandler from './controller/errorController.js';


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

app.use(express.static(path.join(dirname, "dist")));
app.get("/", (req, res) => {
  const filePath = path.join(dirname, "dist", "build", "index.html");

  res.sendFile(filePath, (err) => {
    if (err) {
      if (err.code === "ENOENT") {
        loggerUtil.error(`Build File: index.html not found at ${filePath}`);
        res.status(404).send("File not found");
      } else {
        loggerUtil.error(`Build File Error: ${err.message}`);
        res.status(500).send("Server error");
      }
    }
  });
});

// Define a simple route
app.get('/', (req, res) => {
  res.send('MOGU Node.js server is running!');
});

app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

