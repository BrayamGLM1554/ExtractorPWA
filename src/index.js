require('dotenv').config();
const express = require('express');
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Machotes Extractor API corriendo en puerto ${PORT}`);
  console.log(`POST http://localhost:${PORT}/api/extract`);
});
