import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { Connection } from 'mongoose';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI || '',
        connectionFactory: (connection: Connection) => {
          connection.on('connected', () => {
            console.log('✅ MongoDB Connected Successfully');
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
      }),
    }),
    DatabaseModule,
    // Other modules can be imported here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
