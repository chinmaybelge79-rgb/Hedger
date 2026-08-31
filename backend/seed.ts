import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const companies = [
  { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'Consumer Electronics' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'Software' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'Internet Services' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Semiconductors', industry: 'Semiconductors' },
  { ticker: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Consumer', industry: 'Auto Manufacturers' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'E-Commerce' },
  { ticker: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', country: 'US', currency: 'USD', sector: 'Technology', industry: 'Internet Services' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', country: 'US', currency: 'USD', sector: 'Financials', industry: 'Banks' },
];

async function main() {
  for (const c of companies) {
    await prisma.company.upsert({
      where: { ticker: c.ticker },
      update: c,
      create: c,
    });
  }
  console.log('Seeded companies');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
