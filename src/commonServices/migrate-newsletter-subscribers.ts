import { DataSource } from 'typeorm';

export async function migrateNewsletterSubscribers(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
      id SERIAL PRIMARY KEY,
      email varchar(320) NOT NULL,
      "consentedAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UQ_newsletter_subscribers_email" UNIQUE (email)
    )
  `);
}
