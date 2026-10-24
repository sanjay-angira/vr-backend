import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateWarehouseDto } from 'src/dto/warehouse.dto';

describe('CreateWarehouseDto', () => {
  it('rejects invalid email, phone, and Indian PIN codes', async () => {
    const dto = plainToInstance(CreateWarehouseDto, {
      name: 'Warehouse',
      contactName: 'Contact',
      email: 'not-an-email',
      phone: '123',
      addressLine1: 'Main road',
      city: 'Kota',
      state: 'Rajasthan',
      country: 'India',
      pincode: '1100',
      registeredName: 'Registered account',
      returnAddress: 'Return road',
      returnPin: 'abc',
      returnCity: 'Delhi',
      returnState: 'Delhi',
      returnCountry: 'India',
    });

    const errors = await validate(dto);
    const invalidProperties = errors.map((error) => error.property);
    expect(invalidProperties).toEqual(
      expect.arrayContaining(['email', 'phone', 'pincode', 'returnPin']),
    );
  });
});
