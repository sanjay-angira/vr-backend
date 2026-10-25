import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const ADMIN_API_KEY = 'admin-api';
export const CUSTOMER_API_KEY = 'customer-api';

export const AdminApi = () =>
  applyDecorators(
    SetMetadata(ADMIN_API_KEY, true),
    ApiBearerAuth('access-token'),
  );
export const PublicApi = () => SetMetadata(ADMIN_API_KEY, false);

export const CustomerApi = (options: { allowGuest?: boolean } = {}) =>
  applyDecorators(
    SetMetadata(CUSTOMER_API_KEY, options),
    ...(options.allowGuest ? [] : [ApiBearerAuth('access-token')]),
  );
