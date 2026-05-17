const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const authRoutes = require('./routes/auth'); // Внасяне на новите рутове
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Активиране на маршрутите за Регистрация и Вход
app.use('/api/auth', authRoutes);

// Базов маршрут за тест
app.get('/', (req, res) => {
  res.send('Cognitive App API is running...');
});

// Тест на връзката с базата данни при стартиране
async function testDBConnection() {
  try {
    const [rows] = await pool.query('SELECT 1');
    console.log('✅ Успешно свързване с MySQL базата данни!');
  } catch (error) {
    console.error('❌ Грешка при връзката с базата данни:', error.message);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Сървърът стартира на порт ${PORT}`);
  testDBConnection();
});
