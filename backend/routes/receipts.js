const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const Receipt = require('../models/Receipt');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Parse receipt using Tesseract OCR + Gemini AI
router.post('/parse', upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    console.log('Processing receipt:', req.file.filename);

    // Step 1: Extract text using Tesseract OCR
    console.log('Step 1: Extracting text with Tesseract...');
    const { data: { text } } = await Tesseract.recognize(
      req.file.path,
      'eng',
      {
        logger: m => console.log(m)
      }
    );

    console.log('Extracted text:', text);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from receipt image' });
    }

    // Step 2: Use Gemini AI to parse and structure the data
    console.log('Step 2: Parsing with Gemini AI...');

const model = genAI.getGenerativeModel({ 
  model: "gemini-3-flash-preview"
});

    const prompt = `You are a receipt parser AI. Analyze the following receipt text and extract structured information.

Receipt Text:
${text}

Extract and return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just the JSON):
{
  "storeName": "name of the store or merchant",
  "date": "date in YYYY-MM-DD format (use today's date if not found)",
  "items": [
    {
      "name": "item name",
      "price": numeric price per unit,
      "quantity": numeric quantity (default 1)
    }
  ],
  "totalAmount": total amount as a number
}

Rules:
1. Extract all items with their prices
2. If quantity is mentioned (like "2x" or "Qty: 2"), include it
3. Clean up item names (remove extra characters, fix typos)
4. Ignore non-item lines (like "Thank you", "Total", headers)
5. If total is not found, calculate it from items
6. Return ONLY the JSON object, nothing else`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let geminiText = response.text();

    console.log('Gemini raw response:', geminiText);

    // Clean up Gemini response (remove markdown code blocks if present)
    geminiText = geminiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    let receiptData;
    try {
      receiptData = JSON.parse(geminiText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Attempted to parse:', geminiText);
      return res.status(500).json({ 
        error: 'Failed to parse AI response', 
        details: 'Gemini returned invalid JSON',
        rawResponse: geminiText
      });
    }

    console.log('Parsed receipt data:', receiptData);

    // Validate the parsed data
    if (!receiptData.items || !Array.isArray(receiptData.items) || receiptData.items.length === 0) {
      return res.status(400).json({ 
        error: 'No items found in receipt',
        extractedText: text,
        aiResponse: geminiText
      });
    }

    // Ensure all required fields exist
    receiptData.storeName = receiptData.storeName || 'Unknown Store';
    receiptData.date = receiptData.date || new Date().toISOString().split('T')[0];
    receiptData.totalAmount = receiptData.totalAmount || 
      receiptData.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    // Step 3: Save to MongoDB
    console.log('Step 3: Saving to database...');
    
    const receipt = new Receipt({
      storeName: receiptData.storeName,
      date: new Date(receiptData.date),
      items: receiptData.items.map(item => ({
        name: item.name,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity) || 1
      })),
      totalAmount: parseFloat(receiptData.totalAmount),
      imageUrl: `/uploads/${req.file.filename}`
    });

    await receipt.save();

    console.log('Receipt saved successfully!');

    res.json({
      success: true,
      receipt: receipt,
      extractedText: text,
      aiParsedData: receiptData
    });

  } catch (error) {
    console.error('Error parsing receipt:', error);
    res.status(500).json({ 
      error: 'Failed to parse receipt', 
      details: error.message 
    });
  }
});

// Get all receipts
router.get('/', async (req, res) => {
  try {
    const receipts = await Receipt.find().sort({ createdAt: -1 });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

// Get single receipt
router.get('/:id', async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// Update receipt
router.put('/:id', async (req, res) => {
  try {
    const receipt = await Receipt.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update receipt' });
  }
});

// Delete receipt
router.delete('/:id', async (req, res) => {
  try {
    const receipt = await Receipt.findByIdAndDelete(req.params.id);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

// Add item to receipt
router.post('/:id/items', async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    
    receipt.items.push(req.body);
    receipt.totalAmount = receipt.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await receipt.save();
    
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Update item in receipt
router.put('/:id/items/:itemId', async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    
    const item = receipt.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    Object.assign(item, req.body);
    receipt.totalAmount = receipt.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await receipt.save();
    
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item from receipt
router.delete('/:id/items/:itemId', async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    
    receipt.items.pull(req.params.itemId);
    receipt.totalAmount = receipt.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    await receipt.save();
    
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;