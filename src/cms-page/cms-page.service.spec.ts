import { Repository } from 'typeorm';
import { CmsPage, CmsPageType } from '../entities/CMS/cms-page.entity';
import { CmsPageService } from './cms-page.service';

describe('CmsPageService', () => {
  it('creates a CMS page using supported entity fields', async () => {
    const findOne = jest.fn().mockResolvedValue(null);
    const create = jest.fn((values: object) => values);
    const save = jest.fn().mockImplementation((page: unknown) => page);
    const repository = {
      findOne,
      create,
      save,
    } as unknown as Repository<CmsPage>;
    const service = new CmsPageService(repository);

    await service.create({
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      content: '<p>Privacy details</p>',
      type: CmsPageType.policy,
    });

    expect(create).toHaveBeenCalledWith({
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      content: '<p>Privacy details</p>',
      type: CmsPageType.policy,
      isActive: true,
    });
  });

  it('updates the CMS page type', async () => {
    const page = {
      id: 1,
      title: 'About',
      slug: 'about',
      content: '<p>About us</p>',
      type: null,
      isActive: true,
    };
    const save = jest.fn().mockImplementation((value: unknown) => value);
    const repository = {
      findOne: jest.fn().mockResolvedValue(page),
      save,
    } as unknown as Repository<CmsPage>;
    const service = new CmsPageService(repository);

    await service.update(1, { type: CmsPageType.information });

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ type: CmsPageType.information }),
    );
  });
});
