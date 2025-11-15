import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { processDesignFile } from './services/fileProcessor.js';
import { generateBOMEstimate } from './services/bomEstimator.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// File upload and processing endpoint
app.post('/api/upload-design', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const fileContent = file.buffer.toString('utf-8');
    const fileName = file.originalname;
    const fileSize = file.size;

    console.log(`Processing file: ${fileName} (${fileSize} bytes)`);

    // Process the file to extract information
    const fileInfo = await processDesignFile(fileContent, fileName, fileSize);

    // Generate BOM estimate
    const bomEstimate = await generateBOMEstimate(fileInfo);

    // Combine results
    const result = {
      fileName,
      fileSize,
      fileSizeFormatted: formatFileSize(fileSize),
      pages: fileInfo.pages || 1,
      componentsFound: fileInfo.components?.length || 0,
      components: fileInfo.components || [],
      materials: fileInfo.materials || [],
      bomEstimate,
    };

    res.json(result);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({
      error: 'Failed to process file',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✓ CORS enabled for cross-origin requests`);
  console.log(`✓ File upload endpoint: POST /api/upload-design`);
  if (process.env.ANTHROPIC_API_KEY) {
    console.log(`✓ Anthropic API key loaded (${process.env.ANTHROPIC_API_KEY.substring(0, 10)}...)`);
  } else {
    console.warn(`⚠️  ANTHROPIC_API_KEY not found in environment`);
  }
});

