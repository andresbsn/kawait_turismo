const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Crea un archivo temporal con el contenido proporcionado
 * @param {string} prefix - Prefijo para el nombre del archivo
 * @param {string} suffix - Sufijo para el archivo (generalmente la extensión)
 * @param {string} content - Contenido del archivo
 * @returns {Promise<string>} Ruta del archivo temporal creado
 */
const createTempFile = async (prefix, suffix, content) => {
  return new Promise((resolve, reject) => {
    // Crear un nombre de archivo temporal único
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `${prefix}${Date.now()}${suffix}`);
    
    // Escribir el contenido en el archivo
    fs.writeFile(tempFilePath, content, 'utf8', (err) => {
      if (err) {
        console.error('Error al crear archivo temporal:', err);
        reject(new Error('No se pudo crear el archivo temporal'));
        return;
      }
      resolve(tempFilePath);
    });
  });
};

/**
 * Elimina un archivo temporal
 * @param {string} filePath - Ruta del archivo a eliminar
 * @returns {Promise<void>}
 */
const deleteTempFile = async (filePath) => {
  return new Promise((resolve, reject) => {
    if (!filePath || !fs.existsSync(filePath)) {
      resolve();
      return;
    }
    
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error al eliminar archivo temporal:', err);
        // No rechazamos la promesa para no romper el flujo principal
      }
      resolve();
    });
  });
};

/**
 * Crea un directorio si no existe
 * @param {string} dirPath - Ruta del directorio a crear
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

module.exports = {
  createTempFile,
  deleteTempFile,
  ensureDirectoryExists
};
