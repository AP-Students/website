import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8008;

const prisma = new PrismaClient();

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log('Uploads directory created.');
} else {
  console.log('Uploads directory already exists.');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.status(200).send('Server is running!');
});

app.post('/uploadFile', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: 0, message: 'No file uploaded.' });
  }

  const filePath = `http://localhost:8008/uploads/${req.file.filename}`;

  const fileRecord = await prisma.file.create({
    data: {
      filename: req.file.filename,
      filepath: filePath,
    },
  });

  res.json({
    success: 1,
    file: {
      url: fileRecord.filepath,
    },
  });
});

app.get('/fetchUrl', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: 0, message: 'No URL provided.' });
  }

  try {
    const response = await axios.get(url);
    const data = response.data;

    const titleMatch = data.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : 'No title';

    const descriptionMatch = data.match(/<meta name="description" content="(.*?)"/);
    const description = descriptionMatch ? descriptionMatch[1] : 'No description';

    const imageMatch = data.match(/<meta property="og:image" content="(.*?)"/);
    const imageUrl = imageMatch ? imageMatch[1] : '';

    const meta = {
      title,
      description,
      image: { url: imageUrl }
    };

    res.json({
      success: 1,
      meta
    });
  } catch (error) {
    res.status(500).json({ success: 0, message: 'Failed to fetch URL data.' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
