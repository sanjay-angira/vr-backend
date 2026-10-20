import { DataSource } from 'typeorm';
import { removeUnusedFooterCms } from './remove-unused-footer-cms';

describe('removeUnusedFooterCms', () => {
  it('copies legacy footer columns and links into CMS before dropping old tables', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([
        { cmsSections: 'cms_sections', footerSections: 'footer_sections' },
      ])
      .mockResolvedValueOnce([{ name: 'cms_sections_type_enum' }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ footerItems: 'footer_items' }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);
    const dataSource = { query } as unknown as DataSource;

    await removeUnusedFooterCms(dataSource);

    const statements = query.mock.calls.map(([statement]) => String(statement));
    const copyIndex = statements.findIndex((statement) =>
      statement.includes("'legacyFooterSectionId', section.id"),
    );

    expect(statements[5]).toContain("ADD VALUE IF NOT EXISTS 'footer_section'");
    expect(copyIndex).toBeGreaterThan(5);
    expect(statements[copyIndex]).toContain("'footerLinks'");
    expect(statements[copyIndex]).toContain('jsonb_agg');
    expect(statements[copyIndex]).toContain('NOT EXISTS');
    expect(statements[copyIndex + 1]).toContain(
      'DROP TABLE IF EXISTS "footer_items"',
    );
    expect(statements[copyIndex + 2]).toContain(
      'DROP TABLE IF EXISTS "footer_sections"',
    );
  });
});
