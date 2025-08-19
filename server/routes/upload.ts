import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { isAuthenticated, isAdmin } from "../auth";
import { z } from "zod";
import sharp from "sharp";

const router = Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
const tempDir = path.join(uploadsDir, "temp");
const imagesDir = path.join(uploadsDir, "images");
const documentsDir = path.join(uploadsDir, "documents");

async function ensureDirectories() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(imagesDir, { recursive: true });
    await fs.mkdir(documentsDir, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directories:", error);
  }
}

ensureDirectories();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and common document formats are allowed.'));
    }
  }
});

// Validation schemas
const imageUploadSchema = z.object({
  category: z.enum(['profile', 'business', 'forum', 'blog', 'civic']).optional(),
  resize: z.enum(['thumbnail', 'medium', 'large']).optional(),
});

// Process and optimize images
async function processImage(filePath: string, category: string = 'general', resize?: string) {
  const filename = path.basename(filePath, path.extname(filePath)) + '.webp';
  const outputPath = path.join(imagesDir, filename);
  
  let pipeline = sharp(filePath);

  // Apply resizing based on category and resize parameter
  if (resize === 'thumbnail') {
    pipeline = pipeline.resize(150, 150, { fit: 'cover' });
  } else if (resize === 'medium') {
    pipeline = pipeline.resize(800, 600, { fit: 'inside', withoutEnlargement: true });
  } else if (resize === 'large') {
    pipeline = pipeline.resize(1200, 900, { fit: 'inside', withoutEnlargement: true });
  } else {
    // Default optimization
    pipeline = pipeline.resize(1024, 768, { fit: 'inside', withoutEnlargement: true });
  }

  await pipeline
    .webp({ quality: 85 })
    .toFile(outputPath);

  // Clean up temp file
  await fs.unlink(filePath);

  return `/uploads/images/${filename}`;
}

// Move document to permanent location
async function processDocument(filePath: string) {
  const filename = path.basename(filePath);
  const outputPath = path.join(documentsDir, filename);
  
  await fs.rename(filePath, outputPath);
  
  return `/uploads/documents/${filename}`;
}

// Image upload endpoint
router.post("/images", isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Validate request data
    const { category, resize } = imageUploadSchema.parse(req.body);

    // Check if uploaded file is actually an image
    if (!req.file.mimetype.startsWith('image/')) {
      await fs.unlink(req.file.path); // Clean up
      return res.status(400).json({ error: "Uploaded file is not an image" });
    }

    const imageUrl = await processImage(req.file.path, category, resize);

    res.json({
      message: "Image uploaded successfully",
      url: imageUrl,
      originalName: req.file.originalname,
      size: req.file.size
    });

  } catch (error) {
    console.error("Image upload error:", error);
    
    // Clean up file if it exists
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid request parameters", 
        details: error.errors 
      });
    }

    res.status(500).json({ error: "Image upload failed" });
  }
});

// Document upload endpoint
router.post("/documents", isAuthenticated, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No document file provided" });
    }

    // Check if user has permission to upload documents
    const user = (req as any).user;
    // For now, allow all authenticated users. Could add role checks here.

    const documentUrl = await processDocument(req.file.path);

    res.json({
      message: "Document uploaded successfully",
      url: documentUrl,
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });

  } catch (error) {
    console.error("Document upload error:", error);
    
    // Clean up file if it exists
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }

    res.status(500).json({ error: "Document upload failed" });
  }
});

// Bulk upload endpoint for admin use (CSV data imports, etc.)
router.post("/bulk", isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const fileContent = await fs.readFile(req.file.path, 'utf8');
    
    // Clean up temp file
    await fs.unlink(req.file.path);

    res.json({
      message: "Bulk file uploaded successfully",
      originalName: req.file.originalname,
      size: req.file.size,
      content: req.file.mimetype === 'text/csv' ? fileContent : 'Binary file uploaded'
    });

  } catch (error) {
    console.error("Bulk upload error:", error);
    
    // Clean up file if it exists
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }

    res.status(500).json({ error: "Bulk upload failed" });
  }
});

// Multiple file upload endpoint
router.post("/multiple", isAuthenticated, upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    const results = [];

    for (const file of files) {
      try {
        let fileUrl;
        
        if (file.mimetype.startsWith('image/')) {
          fileUrl = await processImage(file.path);
        } else {
          fileUrl = await processDocument(file.path);
        }

        results.push({
          originalName: file.originalname,
          url: fileUrl,
          size: file.size,
          type: file.mimetype
        });

      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        
        // Clean up failed file
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up failed file:", cleanupError);
        }

        results.push({
          originalName: file.originalname,
          error: "File processing failed"
        });
      }
    }

    res.json({
      message: "Multiple files processed",
      results
    });

  } catch (error) {
    console.error("Multiple upload error:", error);
    
    // Clean up all files if they exist
    const files = req.files as Express.Multer.File[];
    if (files) {
      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }
    }

    res.status(500).json({ error: "Multiple file upload failed" });
  }
});

// Delete file endpoint
router.delete("/:type/:filename", isAuthenticated, async (req, res) => {
  try {
    const { type, filename } = req.params;
    const user = (req as any).user;

    if (!['images', 'documents'].includes(type)) {
      return res.status(400).json({ error: "Invalid file type" });
    }

    // Security check - only allow alphanumeric filenames with common extensions
    if (!/^[\w\-. ]+\.(webp|jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|csv|txt)$/i.test(filename)) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(uploadsDir, type, filename);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: "File not found" });
    }

    // TODO: Add ownership check here - users should only be able to delete their own files
    // For now, require admin privileges for deletion
    const dbUser = await import("../storage").then(m => m.storage.getUserByEmail(user.email));
    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({ error: "Admin privileges required for file deletion" });
    }

    await fs.unlink(filePath);

    res.json({ message: "File deleted successfully" });

  } catch (error) {
    console.error("File deletion error:", error);
    res.status(500).json({ error: "File deletion failed" });
  }
});

export default router;
