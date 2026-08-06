import { Injectable } from '@nestjs/common';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class CommonService {
  /**
   * Normalize pagination input and return offset/limit pair.
   * - page: 1-based
   */
  getPagination(options: PaginationOptions) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const offset = (page - 1) * limit;
    return { page, limit, offset };
  }
}
