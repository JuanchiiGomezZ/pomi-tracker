import { Module } from '@nestjs/common';
import { TaskInstancesController } from './task-instances.controller';
import { TaskInstancesService } from './task-instances.service';

@Module({
  controllers: [TaskInstancesController],
  providers: [TaskInstancesService],
  exports: [TaskInstancesService],
})
export class TaskInstancesModule {}
