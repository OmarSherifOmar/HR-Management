import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
              console.log('✅ MongoDB Connected');
              console.log(`📊 Database: ${connection.name}`);
            });
            connection.on('disconnected', () => {
              console.log('❌ MongoDB Disconnected');
            });
            connection.on('error', (error) => {
              console.error('❌ MongoDB Connection Error:', error);
            });
            return connection;
          },
        };
      },
    }),
    PayrollModule,
  ],
  controllers: [AppController, PayrollController],
  providers: [AppService, PayrollService],
})
export class AppModule {}
