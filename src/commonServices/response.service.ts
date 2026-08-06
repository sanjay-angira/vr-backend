import { Injectable } from '@nestjs/common';

export function errorResponse(message: string, statusCode: number = 400) {
  return {
    success: false,
    message,
    statusCode,
  };
}

export function successResponse(
  data: any,
  message: string = 'Success',
  statusCode: number = 200,
) {
  return {
    success: true,
    message,
    data,
    statusCode,
  };
}
