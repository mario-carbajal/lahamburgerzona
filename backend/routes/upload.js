const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../config/multer');

// POST /api/upload/image - Subir imagen
router.post('/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se ha seleccionado ningún archivo'
      });
    }

    // Generar URL relativa para el frontend
    const imageUrl = `/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Imagen subida correctamente',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: imageUrl,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: 'Error al subir la imagen'
    });
  }
});

// GET /api/upload/images/:filename - Servir imágenes
router.get('/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, '../uploads/images', filename);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        error: 'Imagen no encontrada'
      });
    }

    // Servir el archivo
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({
      success: false,
      error: 'Error al servir la imagen'
    });
  }
});

// DELETE /api/upload/image/:filename - Eliminar imagen
router.delete('/image/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, '../uploads/images', filename);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        error: 'Imagen no encontrada'
      });
    }

    // Eliminar el archivo
    fs.unlinkSync(imagePath);

    res.json({
      success: true,
      message: 'Imagen eliminada correctamente'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la imagen'
    });
  }
});

module.exports = router;
