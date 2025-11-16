import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OnboardingModule } from './modules/onboarding.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://omarhossam:0FWFxI68ZFlXHXoy@cluster0.ibw0sw5.mongodb.net/recruitment?retryWrites=true&w=majority',
    ), OnboardingModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 