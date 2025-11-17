import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

import { PayrollModule } from './payroll/payroll.module';
import { PayrollController } from './payroll/payroll.controller';
import { PayrollService } from './payroll/payroll.service';
import { PayrollModule } from './payroll/payroll.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) {
          throw new Error('MongoDB connection string is not set (MONGODB_URI)');
        }
        return {
          uri,
          connectionFactory: (connection: Connection) => {
            connection.on('connected', () => {
              console.log('MongoDB connected');
              console.log(`Database: ${connection.name}`);
            });
            connection.on('disconnected', () => {
              console.log('MongoDB disconnected');
            });
            connection.on('error', (error) => {
              console.error('MongoDB connection error:', error);
            });
            return connection;
          },
        };
      },
    }),
    
    // Other modules can be imported here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 
