import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
/* PayrollApprovalModule import removed because the referenced file was not found */
// PayrollApprovalModule import removed because the file does not exist
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI ?? 'mongodb://localhost:27017/hr-management'),
    // PayrollApprovalModule removed because the module file could not be found
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
