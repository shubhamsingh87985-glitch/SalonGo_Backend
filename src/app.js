const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');

const { env } = require('./config/env');
const routes = require('./routes');
const AppError = require('./utils/AppError');
const errorHandler = require('./middlewares/errorHandlerMiddleware');
const sanitizeBody = require('./middlewares/sanitizeBodyMiddleware');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL === '*' ? '*' : env.CLIENT_URL.split(',').map((url) => url.trim()),
  credentials: true
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  standardHeaders: true,
  legacyHeaders: false
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());
app.use(sanitizeBody);
app.use(compression());

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SalonGo API is healthy',
    data: {
      app: 'SalonGo',
      company: 'ASRVTech',
      uptime: process.uptime()
    }
  });
});

app.use('/api/v1', routes);

app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(errorHandler);

module.exports = app;
