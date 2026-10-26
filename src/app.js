const path = require('node:path');
const express = require('express');
const multer = require('multer');
const config = require('./config/config');
const productRoutes = require('./routes/productRoutes');
const storageRoutes = require('./routes/storageRoutes');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(config.projectRoot, 'src', 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(config.projectRoot, 'public')));

app.locals.currency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
app.locals.dateTime = (value) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '-';
app.locals.fileSize = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

app.get('/', (_request, response) => response.redirect('/products'));
app.use('/products', productRoutes);
app.use('/storage', storageRoutes);
app.use((_request, response) => response.status(404).render('error', { status: 404, message: 'Página não encontrada.' }));
app.use((error, _request, response, _next) => {
  const isUploadError = error instanceof multer.MulterError;
  const status = error.status || (isUploadError ? 400 : 500);
  console.error(error);
  response.status(status).render('error', { status, message: isUploadError ? `Falha no upload: ${error.message}` : error.message || 'Erro interno da aplicação.' });
});
module.exports = app;
