import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ParentInsightsService, ChildInsight } from './parent-insights.service';

@Controller('parent')
@UseGuards(JwtAuthGuard)
export class ParentInsightsController {
  constructor(private readonly insightsService: ParentInsightsService) {}

  @Get('insights')
  async getInsights(@Request() req): Promise<{ children: ChildInsight[] }> {
    // JWT strategy returns user.id (not user.sub)
    return this.insightsService.getInsights(req.user.id);
  }
}
