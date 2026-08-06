import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationDto } from 'src/dto/common.dto';
import {
  SendContactLeadOtpDto,
  UpdateContactLeadStatusDto,
  VerifyContactLeadOtpDto,
} from 'src/dto/contact-us-lead.dto';
import { ContactUsLeadsService } from './contact-us-leads.service';

@ApiTags('Contact Us Leads')
@Controller()
export class ContactUsLeadsController {
  constructor(private readonly contactUsLeadsService: ContactUsLeadsService) {}

  @Post('customer/contact-us/send-otp')
  @ApiOperation({ summary: 'Send OTP for contact-us lead email verification' })
  @ApiBody({ type: SendContactLeadOtpDto })
  async sendOtp(@Body() sendContactLeadOtpDto: SendContactLeadOtpDto) {
    return this.contactUsLeadsService.sendOtp(sendContactLeadOtpDto);
  }

  @Post('customer/contact-us/verify-otp')
  @ApiOperation({ summary: 'Verify OTP and create contact-us lead' })
  @ApiBody({ type: VerifyContactLeadOtpDto })
  async verifyOtp(@Body() verifyContactLeadOtpDto: VerifyContactLeadOtpDto) {
    return this.contactUsLeadsService.verifyOtp(verifyContactLeadOtpDto);
  }

  @Get('contact-us-leads')
  @ApiOperation({ summary: 'Get all contact us leads' })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.contactUsLeadsService.findAll(paginationDto);
  }

  @Get('contact-us-leads/:id')
  @ApiOperation({ summary: 'Get contact us lead by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contactUsLeadsService.findOne(id);
  }

  @Patch('contact-us-leads/:id/status')
  @ApiOperation({ summary: 'Update contact us lead status' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiBody({ type: UpdateContactLeadStatusDto })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContactLeadStatusDto: UpdateContactLeadStatusDto,
  ) {
    return this.contactUsLeadsService.updateStatus(
      id,
      updateContactLeadStatusDto,
    );
  }

  @Delete('contact-us-leads/:id')
  @ApiOperation({ summary: 'Delete contact us lead' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.contactUsLeadsService.remove(id);
  }
}
