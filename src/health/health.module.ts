import { HealthController } from './health.controller.js';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

@Module({
    imports: [TerminusModule, HttpModule],
    controllers: [HealthController],
})
export class HealthModule {}
