import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Admin dashboard summary (stats, sales, low stock, recent orders)',
  })
  getSummary() {
    return this.dashboardService.getSummary();
  }
}
