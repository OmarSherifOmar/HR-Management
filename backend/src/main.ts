import { ValidationPipe, INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import mongoose from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { DepartmentSchema } from './organization-structure/models/department.schema';
import { join } from 'path';
import * as express from 'express';

async function printRoutes(app) {
  await app.init(); // ensure adapters mounted
  const adapter = app.getHttpAdapter();
  const instance = adapter.getInstance(); // express app
  const stack = instance._router?.stack ?? [];
  const routes: string[] = [];
  stack.forEach((layer) => {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
      routes.push(`${methods} ${layer.route.path}`);
    }
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001','https://hr-management-1-lim3.onrender.com','https://hr-management-3boc.onrender.com'], // Your frontend URL and same origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  // Serve static files (uploads)
  const uploadsPath = join(__dirname, '..', 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  console.log(`Static files serving from: ${uploadsPath}`);

  // Get the NestJS mongoose connection and register Department model globally
  // This fixes position.schema.ts middleware that uses model(Department.name)
  const connection = app.get(getConnectionToken());
  
  // Set mongoose's default connection to the NestJS connection
  // so that model() calls in schema middleware use the right connection
  if (mongoose.connection.readyState === 0) {
    mongoose.connection.setClient(connection.getClient());
  }
  
  // Register Department on the global mongoose if not already registered
  if (!mongoose.models['Department']) {
    mongoose.model('Department', DepartmentSchema);
  }

  // cookies for AuthGuard to read req.cookies.token
  app.use(cookieParser());

  // enable global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // print routes to console for debugging
  printRoutes(app);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Listening on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
