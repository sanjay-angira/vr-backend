import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/dto/common.dto';
import {
  SendContactLeadOtpDto,
  UpdateContactLeadStatusDto,
  VerifyContactLeadOtpDto,
} from 'src/dto/contact-us-lead.dto';
import {
  successResponse,
  errorResponse,
} from 'src/commonServices/response.service';
import { UtilityService } from 'src/commonServices/utility.service';
import {
  ContactLeadStatus,
  ContactUsLead,
} from 'src/entities/contact/contact-us-lead.entity';
import { Repository } from 'typeorm';
import { NodemailerService } from 'src/commonServices/nodemailer.service';
import { EmailTemplate } from 'src/commonServices/emailTempaltes/Emailtemplate';

@Injectable()
export class ContactUsLeadsService {
  constructor(
    @InjectRepository(ContactUsLead)
    private readonly contactLeadRepository: Repository<ContactUsLead>,
    private readonly utilityService: UtilityService,
    private readonly nodemailerService: NodemailerService,
    private readonly emailTemplate: EmailTemplate,
  ) {}

  async sendOtp(sendContactLeadOtpDto: SendContactLeadOtpDto) {
    try {
      const email = sendContactLeadOtpDto.email.trim().toLowerCase();
      const existingLead = await this.contactLeadRepository.findOne({
        where: { email, emailVerified: false },
        order: { id: 'DESC' },
      });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 10);

      const lead = existingLead
        ? this.contactLeadRepository.merge(existingLead, {
            ...sendContactLeadOtpDto,
            email,
            emailOtp: otp,
            emailOtpExpires: expires,
            emailVerified: false,
            verifiedAt: null,
            status: ContactLeadStatus.NEW,
          })
        : this.contactLeadRepository.create({
            ...sendContactLeadOtpDto,
            email,
            emailOtp: otp,
            emailOtpExpires: expires,
            emailVerified: false,
            verifiedAt: null,
            status: ContactLeadStatus.NEW,
          });

      await this.contactLeadRepository.save(lead);

      const emailHtml = this.emailTemplate.forgotPasswordOtpTemplate({
        title: 'Contact Us Verification OTP',
        heading: 'Verify Your Email Address',
        otp,
        expirationTime: '10 minutes',
      });

      await this.nodemailerService.sendMail({
        to: email,
        subject: 'Contact Us Email Verification OTP',
        html: emailHtml,
      });

      return successResponse(
        { email },
        'OTP sent to your email successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw error;
    }
  }

  async verifyOtp(verifyContactLeadOtpDto: VerifyContactLeadOtpDto) {
    try {
      const email = verifyContactLeadOtpDto.email.trim().toLowerCase();
      const lead = await this.contactLeadRepository.findOne({
        where: { email },
        order: { id: 'DESC' },
      });

      if (!lead) {
        return errorResponse('Lead not found', HttpStatus.NOT_FOUND);
      }

      if (lead.emailVerified) {
        return successResponse(lead, 'Lead already verified', HttpStatus.OK);
      }

      if (lead.emailOtp !== verifyContactLeadOtpDto.otp) {
        return errorResponse('Invalid OTP', HttpStatus.BAD_REQUEST);
      }

      if (!lead.emailOtpExpires || lead.emailOtpExpires < new Date()) {
        return errorResponse('OTP has expired', HttpStatus.BAD_REQUEST);
      }

      lead.emailVerified = true;
      lead.verifiedAt = new Date();
      lead.emailOtp = null;
      lead.emailOtpExpires = null;
      lead.status = ContactLeadStatus.NEW;

      const savedLead = await this.contactLeadRepository.save(lead);

      return successResponse(
        savedLead,
        'Email verified and lead submitted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw error;
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      pageNumber,
      pageSize,
      search,
      column = 'createdAt',
      order = 'DESC',
    } = paginationDto;

    try {
      const queryBuilder =
        this.contactLeadRepository.createQueryBuilder('lead');

      if (this.utilityService.validateSearch(search) && search) {
        queryBuilder.andWhere(
          `(lead.firstName ILIKE :search OR lead.lastName ILIKE :search OR lead.email ILIKE :search OR lead.phoneNumber ILIKE :search OR lead.message ILIKE :search OR CAST(lead.status AS TEXT) ILIKE :search)`,
          { search: `%${search}%` },
        );
      }

      const validColumns = [
        'id',
        'firstName',
        'lastName',
        'email',
        'phoneNumber',
        'status',
        'createdAt',
        'updatedAt',
      ];
      const orderColumn = validColumns.includes(column) ? column : 'createdAt';
      queryBuilder.orderBy(
        `lead.${orderColumn}`,
        order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
      );

      const count = await queryBuilder.getCount();

      if (
        this.utilityService.validatePageNumber(pageNumber) &&
        this.utilityService.validatePageSize(pageSize)
      ) {
        const page = Number(pageNumber);
        const size = Number(pageSize);
        queryBuilder.skip((page - 1) * size).take(size);
      }

      const rows = await queryBuilder.getMany();

      return successResponse(
        { rows, count },
        'Contact leads retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    const lead = await this.contactLeadRepository.findOne({ where: { id } });

    if (!lead) {
      throw new NotFoundException(`Contact lead with ID ${id} not found`);
    }

    return successResponse(
      lead,
      'Contact lead retrieved successfully',
      HttpStatus.OK,
    );
  }

  async updateStatus(
    id: number,
    updateContactLeadStatusDto: UpdateContactLeadStatusDto,
  ) {
    const lead = await this.contactLeadRepository.findOne({ where: { id } });

    if (!lead) {
      throw new NotFoundException(`Contact lead with ID ${id} not found`);
    }

    lead.status = updateContactLeadStatusDto.status;
    const savedLead = await this.contactLeadRepository.save(lead);

    return successResponse(
      savedLead,
      'Lead status updated successfully',
      HttpStatus.OK,
    );
  }

  async remove(id: number) {
    const lead = await this.contactLeadRepository.findOne({ where: { id } });

    if (!lead) {
      throw new NotFoundException(`Contact lead with ID ${id} not found`);
    }

    await this.contactLeadRepository.delete({ id });

    return successResponse(null, 'Lead deleted successfully', HttpStatus.OK);
  }
}
