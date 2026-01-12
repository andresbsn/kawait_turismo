const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const { createTempFile, deleteTempFile } = require('./fileHelper');

// Registrar helpers de Handlebars
Handlebars.registerHelper('formatDate', (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR');
});

Handlebars.registerHelper('formatCurrency', (value) => {
  if (value === undefined || value === null) return '$0.00';
  return new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(value);
});

Handlebars.registerHelper('formatMoney', (value, currency) => {
  const amount = value === undefined || value === null ? 0 : Number(value);
  const c = String(currency || 'ARS').toUpperCase();
  if (c === 'USD') {
    // En AR suele preferirse mostrar USD 1.234,56
    return `USD ${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`;
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
});

Handlebars.registerHelper('lowercase', (str) => {
  return str ? String(str).toLowerCase() : '';
});

Handlebars.registerHelper('eq', (a, b) => {
  return a === b;
});

// Cargar plantilla HTML
const loadTemplate = async (templateName) => {
  try {
    const templatePath = path.join(__dirname, `../templates/${templateName}.hbs`);
    const templateContent = await fs.promises.readFile(templatePath, 'utf8');
    return Handlebars.compile(templateContent);
  } catch (error) {
    console.error('Error al cargar la plantilla:', error);
    throw new Error(`No se pudo cargar la plantilla: ${templateName}`);
  }
};

// Generar HTML a partir de la plantilla
const generateHtml = async (templateName, data) => {
  try {
    const template = await loadTemplate(templateName);
    return template(data);
  } catch (error) {
    console.error('Error al generar HTML:', error);
    throw new Error('Error al generar el contenido HTML');
  }
};

// Crear PDF a partir de HTML
const createPdfFromHtml = async (templateName, data) => {
  try {
    // Verificar si html-pdf-node está disponible
    let htmlToPdf;
    try {
      htmlToPdf = require('html-pdf-node');
    } catch (error) {
      console.warn('html-pdf-node no está instalado. Por favor, instálalo con: npm install html-pdf-node');
      throw new Error('Módulo html-pdf-node no encontrado');
    }

    // Generar el HTML
    const htmlContent = await generateHtml(templateName, data);
    
    // Opciones para el PDF
    const options = {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
      preferCSSPageSize: true,
      timeout: 30000 // 30 segundos de timeout
    };

    // Crear archivo temporal con el HTML
    const tempHtmlFile = await createTempFile('comprobante-', '.html', htmlContent);
    
    try {
      // Generar el PDF
      const pdfBuffer = await htmlToPdf.generatePdf({ url: `file://${tempHtmlFile}` }, options);
      return pdfBuffer;
    } finally {
      // Limpiar archivo temporal
      await deleteTempFile(tempHtmlFile);
    }
  } catch (error) {
    console.error('Error al generar PDF:', error);
    throw new Error('Error al generar el documento PDF');
  }
};

module.exports = {
  createPdfFromHtml
};
