import 'dotenv/config';
import { scraper } from './services/scraper';

(async () => {
  try {
    await scraper.scrapeAndStoreData();
    console.log('Scraping complete.');
  } catch (error) {
    console.error('Error during scraping:', error);
    process.exit(1);
  }
})();
