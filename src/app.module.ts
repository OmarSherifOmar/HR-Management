import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OnboardingModule } from './Recruitment/modules/onboarding.module';
import { OffboardingModule } from './Recruitment/modules/offboarding.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://omarhossam:0FWFxI68ZFlXHXoy@cluster0.ibw0sw5.mongodb.net/recruitment?retryWrites=true&w=majority',
    ),
    OnboardingModule,
    OffboardingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}