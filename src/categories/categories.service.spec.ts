import { Repository } from 'typeorm';
import { UtilityService } from 'src/commonServices/utility.service';
import { Category } from '../entities/productCategory/category.entity';
import { CategorySeo } from '../entities/productCategory/category-seo.entity';
import { Offer } from '../entities/product/offer.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { CategoriesService } from './categories.service';

describe('CategoriesService category slugs', () => {
  const categoryRepo = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const categorySeoRepo = { create: jest.fn() };
  const offerRepo = { findByIds: jest.fn() };
  const utilityService = {
    createSlug: jest.fn((name: string) =>
      name.toLowerCase().replace(/\s+/g, '-'),
    ),
  };

  let service: CategoriesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CategoriesService(
      categoryRepo as unknown as Repository<Category>,
      categorySeoRepo as unknown as Repository<CategorySeo>,
      offerRepo as unknown as Repository<Offer>,
      utilityService as unknown as UtilityService,
    );
  });

  it('creates a unique slug on the backend when the base slug is taken', async () => {
    const savedCategory = {
      id: 8,
      categoryName: 'New Category',
      categorySlug: 'new-category-2',
    } as Category;
    categoryRepo.create.mockImplementation((values) => values);
    categoryRepo.findOne
      .mockResolvedValueOnce({ id: 3 } as Category)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(savedCategory);
    categoryRepo.save.mockResolvedValue(savedCategory);

    await service.create({
      categoryName: 'New Category',
    } as CreateCategoryDto);

    expect(categoryRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ categorySlug: 'new-category-2' }),
    );
  });

  it('regenerates the slug when a category name changes', async () => {
    const category = {
      id: 4,
      categoryName: 'Old Name',
      categorySlug: 'old-name',
    } as Category;
    categoryRepo.findOne
      .mockResolvedValueOnce(category)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(category);
    categoryRepo.save.mockResolvedValue(category);

    await service.update(4, {
      categoryName: 'Updated Name',
    } as UpdateCategoryDto);

    expect(category.categorySlug).toBe('updated-name');
  });
});
