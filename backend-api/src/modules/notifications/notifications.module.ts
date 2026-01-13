import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ReminderTaskService } from './reminder-task.service';

@Module({
  imports: [ConfigModule, ScheduleModule.forRoot()],
  controllers: [NotificationsController],
  providers: [NotificationsService, ReminderTaskService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
