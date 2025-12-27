import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { ALLOWED_ORIGINS } from './constants';
import aiController from './controllers/ai.controller';
import composeEmailController from './controllers/composeEmail.controller';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// multer config for the file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // allow the max of 10MB
  },
});

app.use(cors({
  origin: ALLOWED_ORIGINS,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get(['/', '/health'], (_, res: Response) => {
  res.json({ status: '🟢 Server Healthy' }).status(200);
});


app.post("/ai", upload.any(), (req: Request, res: Response) => {
  aiController(req, res);
});

app.post("/compose-email", (req: Request, res: Response) => {
  composeEmailController(req, res);
})


app.listen(PORT, () => {
  try {
    console.log(`Server is running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('🔴 Error starting the server', (error as Error).message);
    process.exit(1);
  }
});

