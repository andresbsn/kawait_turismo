const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Middleware para optimizar y comprimir imágenes subidas antes de guardarlas definitivamente.
 * Convierte las imágenes a WebP con redimensión máxima de 1600x1600 y calidad 80%.
 */
const optimizeImage = async (req, res, next) => {
    // Si no hay archivo subido o no es una imagen, continuar sin procesar
    if (!req.file || !req.file.mimetype.startsWith('image/')) {
        return next();
    }

    try {
        const originalPath = req.file.path;
        const ext = path.extname(originalPath).toLowerCase();
        
        // Carpeta y nuevo nombre de archivo
        const dir = path.dirname(originalPath);
        const nameWithoutExt = path.basename(originalPath, ext);
        const newFilename = `${nameWithoutExt}.webp`;
        const newPath = path.join(dir, newFilename);

        // Procesar la imagen con sharp
        await sharp(originalPath)
            .resize({
                width: 1600,
                height: 1600,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(newPath);

        // Eliminar el archivo original para ahorrar espacio
        if (fs.existsSync(originalPath)) {
            fs.unlinkSync(originalPath);
        }

        // Obtener tamaño y estadísticas del nuevo archivo optimizado
        const stats = fs.statSync(newPath);

        // Actualizar la metadata del archivo en req.file para que el controlador trabaje de forma transparente
        req.file.path = newPath;
        req.file.filename = newFilename;
        req.file.mimetype = 'image/webp';
        req.file.size = stats.size;

        next();
    } catch (error) {
        console.error('Error al optimizar la imagen con sharp:', error);
        // Si por alguna razón falla, no bloqueamos la petición, dejamos que continúe con el archivo original
        next();
    }
};

module.exports = { optimizeImage };
