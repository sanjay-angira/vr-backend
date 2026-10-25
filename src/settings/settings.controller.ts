import { Controller } from '@nestjs/common';
import { AdminApi } from '../commonServices/admin-api.decorator';

@AdminApi()
@Controller('settings')
export class SettingsController {}
