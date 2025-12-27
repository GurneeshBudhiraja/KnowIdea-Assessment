import express, { Request, Response } from 'express';
import cors from 'cors';
import { ALLOWED_ORIGINS } from './constants';

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({
  origin: ALLOWED_ORIGINS,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  try {
    console.log(`Server is running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('🔴 Error starting the server', (error as Error).message);
    process.exit(1);
  }
});

