import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import url from 'url';
import loggerUtil from './utils/logger.js';
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger_output.json" assert { type: "json" };

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

app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Guest Book API Doc',
}));

// Serve frontend build
app.use(express.static(path.join(dirname, 'dist')));
app.get(/^\/(?!api|api-docs).*/, (req, res) => {
  res.sendFile(path.join(dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      loggerUtil.error(`Error serving index.html: ${err.message}`);
      res.status(500).send("Server error");
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

