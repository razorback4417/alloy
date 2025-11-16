import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { processDesignFile } from './services/fileProcessor.js';
import { generateBOMEstimate } from './services/bomEstimator.js';
import { sourceVendors } from './services/vendorSourcing.js';
import { sendEmail } from './services/emailService.js';
import { executePaymentsWithLocus } from './services/paymentExecutor.js';

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
    // Uses enhanced processing if ENHANCED_FILE_PROCESSING=true
    // Enhanced mode extracts: materials, specs, certifications, environmental constraints, tolerances
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

// Vendor sourcing endpoint
app.post('/api/source-vendors', async (req, res) => {
  try {
    const { components, spendingLimit, priorities } = req.body;

    if (!components || !Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ error: 'Components array is required' });
    }

    if (typeof spendingLimit !== 'number' || spendingLimit <= 0) {
      return res.status(400).json({ error: 'Valid spending limit is required' });
    }

    if (!priorities || typeof priorities !== 'object') {
      return res.status(400).json({ error: 'Priorities object is required' });
    }

    console.log(`Sourcing vendors for ${components.length} components with spending limit $${spendingLimit}`);
    console.log('Components:', components.map(c => `${c.name} (qty: ${c.quantity})`).join(', '));

    const startTime = Date.now();
    const result = await sourceVendors({
      components,
      spendingLimit,
      priorities,
    });
    const duration = Date.now() - startTime;

    console.log(`✓ Vendor sourcing completed in ${duration}ms`);
    console.log(`✓ Found vendors for ${result.componentSearches.length} components`);

    res.json(result);
  } catch (error) {
    console.error('Error sourcing vendors:', error);
    res.status(500).json({
      error: 'Failed to source vendors',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, textPart, htmlPart, customId } = req.body;

    if (!to || !Array.isArray(to) || to.length === 0) {
      return res.status(400).json({ error: 'Recipients array is required' });
    }

    if (!subject || !textPart || !htmlPart) {
      return res.status(400).json({ error: 'Subject, textPart, and htmlPart are required' });
    }

    console.log(`Sending email to ${to.length} recipient(s): ${subject}`);

    const result = await sendEmail({
      to,
      subject,
      textPart,
      htmlPart,
      customId,
    });

    console.log(`✓ Email sent successfully. Message IDs: ${result.messageIds.join(', ')}`);

    res.json(result);
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Email reply webhook endpoint (for Mailjet to post replies)
app.post('/api/email-reply', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Mailjet webhook payload
    const payload = JSON.parse(req.body.toString());
    console.log('Received email reply webhook:', JSON.stringify(payload, null, 2));

    // Store reply in memory (in production, use a database)
    // For now, we'll just log it and return success
    // The frontend can poll for replies or we can use WebSockets

    res.json({ status: 'received' });
  } catch (error) {
    console.error('Error processing email reply:', error);
    res.status(500).json({ error: 'Failed to process email reply' });
  }
});

// Get email replies endpoint
app.get('/api/email-replies', (req, res) => {
  // In production, this would query a database
  // For now, return empty array
  res.json({ replies: [] });
});

// Payment execution endpoint
app.post('/api/execute-payment', async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !Array.isArray(plan) || plan.length === 0) {
      return res.status(400).json({ error: 'Procurement plan is required' });
    }

    console.log(`Executing payment for ${plan.length} items`);

    const result = await executePaymentsWithLocus(plan);

    if (!result.success) {
      return res.status(500).json({
        error: 'Payment execution failed',
        details: result.errors
      });
    }

    console.log(`✓ Payment executed successfully. Transaction hashes: ${result.transactionHashes.join(', ')}`);

    res.json(result);
  } catch (error) {
    console.error('Error executing payment:', error);
    res.status(500).json({
      error: 'Failed to execute payment',
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
  console.log(`✓ Vendor sourcing endpoint: POST /api/source-vendors`);
    console.log(`✓ Email sending endpoint: POST /api/send-email`);
    console.log(`✓ Email reply webhook: POST /api/email-reply`);
    console.log(`✓ Payment execution endpoint: POST /api/execute-payment`);
    if (process.env.ANTHROPIC_API_KEY) {
      console.log(`✓ Anthropic API key loaded (${process.env.ANTHROPIC_API_KEY.substring(0, 10)}...)`);
    } else {
      console.warn(`⚠️  ANTHROPIC_API_KEY not found in environment`);
    }
    if (process.env.LOCUS_API_KEY) {
      console.log(`✓ Locus API key loaded (${process.env.LOCUS_API_KEY.substring(0, 10)}...)`);
    } else {
      console.warn(`⚠️  LOCUS_API_KEY not found in environment`);
    }
});

