import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected:', mongoose.connection.name);
  });
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err?.message ?? err);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();