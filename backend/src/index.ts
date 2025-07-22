import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import awardsRouter from './routes/awards.js';
import summariesRouter from './routes/summaries.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// --- Image Upload Setup ---
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(uploadDir));

// --- API Routes ---
app.use('/api/awards', awardsRouter);
app.use('/api/summaries', summariesRouter);

// Upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  // Respond with the path to the uploaded file
  res.json({ filePath: `/uploads/${req.file.filename}` });
});


// GET all categories
app.get('/api/categories', async (req, res) => {
  const categories = await prisma.category.findMany();
  res.json(categories);
});


const port = process.env.PORT || 3001;
app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  
  // Seed initial categories
  const count = await prisma.category.count();
  if (count === 0) {
    await prisma.category.createMany({
      data: [
        { categoryName: '安全' },
        { categoryName: '服務' },
        { categoryName: '永續' },
      ],
    });
    console.log('Initial categories have been seeded.');
  }
}); 