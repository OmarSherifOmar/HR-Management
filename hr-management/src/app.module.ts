import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PayrollConfigModule } from './payroll-config/payroll-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI || '',
        connectionFactory: (connection) => {
          connection.on('connected', () => {
            console.log('🟢 MongoDB Connected Successfully');
            console.log(`🗄️  Database: ${connection.name}`);
          });

          connection.on('disconnected', () => {
            console.log('🔴 MongoDB Disconnected');
          });

          connection.on('error', (error) => {
            console.error('❌ MongoDB Connection Error:', error);
          });

          return connection;
        },
      }),
    }),

    PayrollConfigModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 
