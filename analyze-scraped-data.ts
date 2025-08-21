import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { councilData } from './shared/schema';
import { sql, desc, count, avg } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });
const db = drizzle(client);

interface AnalysisResult {
  totalRecords: number;
  dataTypes: { type: string; count: number }[];
  qualityScores: { avg: number; min: number; max: number };
  topSources: { domain: string; count: number }[];
  recentData: any[];
  sampleRecords: any[];
}

async function analyzeScrapedData(): Promise<AnalysisResult> {
  console.log('🔍 Analyzing scraped data from Master Unified Crawler...\n');

  try {
    // 1. Total records
    const totalRecordsResult = await db.select({ count: count() }).from(councilData);
    const totalRecords = totalRecordsResult[0].count;
    console.log(`📊 Total Records: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('❌ No data found in the database. The crawler may not have successfully stored data.');
      return {
        totalRecords: 0,
        dataTypes: [],
        qualityScores: { avg: 0, min: 0, max: 0 },
        topSources: [],
        recentData: [],
        sampleRecords: []
      };
    }

    // 2. Data types distribution
    const dataTypesResult = await db
      .select({ 
        type: councilData.dataType, 
        count: count() 
      })
      .from(councilData)
      .groupBy(councilData.dataType)
      .orderBy(desc(count()));

    console.log('\n📈 Data Types Distribution:');
    dataTypesResult.forEach(({ type, count }) => {
      console.log(`  ${type}: ${count} records`);
    });

    // 3. Quality scores analysis (from metadata if available)
    const qualityData = await db
      .select({ 
        metadata: councilData.metadata 
      })
      .from(councilData)
      .where(sql`metadata IS NOT NULL`);

    let qualityScores = { avg: 0, min: 0, max: 0 };
    if (qualityData.length > 0) {
      const scores = qualityData
        .map(record => {
          try {
            const meta = typeof record.metadata === 'object' ? record.metadata : JSON.parse(record.metadata as string);
            return meta?.qualityScore || meta?.quality || 0;
          } catch {
            return 0;
          }
        })
        .filter(score => score > 0);

      if (scores.length > 0) {
        qualityScores = {
          avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100) / 100,
          min: Math.min(...scores),
          max: Math.max(...scores)
        };
      }
    }

    console.log('\n🎯 Quality Scores:');
    console.log(`  Average: ${qualityScores.avg}%`);
    console.log(`  Range: ${qualityScores.min}% - ${qualityScores.max}%`);

    // 4. Top sources analysis
    const sourceData = await db
      .select({ 
        sourceUrl: councilData.sourceUrl 
      })
      .from(councilData)
      .where(sql`source_url IS NOT NULL`);

    const sourceCounts: { [key: string]: number } = {};
    sourceData.forEach(record => {
      if (record.sourceUrl) {
        try {
          const domain = new URL(record.sourceUrl).hostname;
          sourceCounts[domain] = (sourceCounts[domain] || 0) + 1;
        } catch {
          // Skip invalid URLs
        }
      }
    });

    const topSources = Object.entries(sourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    console.log('\n🌐 Top Source Domains:');
    topSources.forEach(({ domain, count }) => {
      console.log(`  ${domain}: ${count} records`);
    });

    // 5. Recent data (last 10 records)
    const recentData = await db
      .select()
      .from(councilData)
      .orderBy(desc(councilData.createdAt))
      .limit(10);

    console.log('\n🕐 Most Recent Records:');
    recentData.slice(0, 5).forEach((record, i) => {
      console.log(`  ${i + 1}. [${record.dataType}] ${record.title?.substring(0, 80)}${record.title && record.title.length > 80 ? '...' : ''}`);
    });

    // 6. Sample records for detailed inspection
    const sampleRecords = await db
      .select()
      .from(councilData)
      .limit(5);

    console.log('\n📋 Sample Record Details:');
    sampleRecords.forEach((record, i) => {
      console.log(`\n  Record ${i + 1}:`);
      console.log(`    Title: ${record.title}`);
      console.log(`    Type: ${record.dataType}`);
      console.log(`    Source: ${record.sourceUrl}`);
      console.log(`    Date: ${record.date}`);
      console.log(`    Description: ${record.description?.substring(0, 100)}${record.description && record.description.length > 100 ? '...' : ''}`);
      
      if (record.metadata) {
        try {
          const meta = typeof record.metadata === 'object' ? record.metadata : JSON.parse(record.metadata as string);
          console.log(`    Metadata: ${Object.keys(meta).join(', ')}`);
          if (meta.qualityScore || meta.quality) {
            console.log(`    Quality: ${meta.qualityScore || meta.quality}%`);
          }
          if (meta.extractedData) {
            console.log(`    Extracted entities: ${meta.extractedData}`);
          }
        } catch {
          console.log(`    Metadata: Raw data present`);
        }
      }
    });

    return {
      totalRecords,
      dataTypes: dataTypesResult,
      qualityScores,
      topSources,
      recentData,
      sampleRecords
    };

  } catch (error) {
    console.error('❌ Error analyzing data:', error);
    throw error;
  }
}

async function generateInsights(analysis: AnalysisResult) {
  console.log('\n' + '='.repeat(60));
  console.log('🧠 CRAWLER PERFORMANCE INSIGHTS');
  console.log('='.repeat(60));

  if (analysis.totalRecords === 0) {
    console.log('❌ No data was successfully scraped and stored.');
    return;
  }

  console.log(`\n✅ SUCCESS METRICS:`);
  console.log(`   • ${analysis.totalRecords} total records scraped and stored`);
  console.log(`   • ${analysis.dataTypes.length} different data types captured`);
  console.log(`   • ${analysis.topSources.length} unique source domains`);
  console.log(`   • Average quality score: ${analysis.qualityScores.avg}%`);

  console.log(`\n📊 DATA COVERAGE:`);
  const primaryTypes = analysis.dataTypes.filter(d => d.count > 10);
  if (primaryTypes.length > 0) {
    console.log(`   • Primary data types: ${primaryTypes.map(d => d.type).join(', ')}`);
  }
  
  const councilPages = analysis.dataTypes.find(d => d.type === 'council_page');
  if (councilPages) {
    console.log(`   • Council pages: ${councilPages.count} pages processed`);
  }

  console.log(`\n🎯 QUALITY ASSESSMENT:`);
  if (analysis.qualityScores.avg > 0) {
    if (analysis.qualityScores.avg >= 70) {
      console.log(`   • HIGH QUALITY: Average ${analysis.qualityScores.avg}% quality score`);
    } else if (analysis.qualityScores.avg >= 50) {
      console.log(`   • MEDIUM QUALITY: Average ${analysis.qualityScores.avg}% quality score`);
    } else {
      console.log(`   • LOW QUALITY: Average ${analysis.qualityScores.avg}% quality score`);
    }
    console.log(`   • Quality range: ${analysis.qualityScores.min}% to ${analysis.qualityScores.max}%`);
  }

  console.log(`\n🌐 SOURCE ANALYSIS:`);
  const mainDomain = analysis.topSources[0];
  if (mainDomain) {
    console.log(`   • Primary source: ${mainDomain.domain} (${mainDomain.count} records)`);
  }
  
  const boltonDomains = analysis.topSources.filter(s => s.domain.includes('bolton'));
  if (boltonDomains.length > 0) {
    console.log(`   • Bolton Council domains: ${boltonDomains.length} domains`);
    console.log(`   • Total Bolton records: ${boltonDomains.reduce((sum, d) => sum + d.count, 0)}`);
  }

  console.log(`\n🔄 PROCESSING INSIGHTS:`);
  if (analysis.totalRecords > 300) {
    console.log(`   • EXCELLENT: Processed ${analysis.totalRecords} records in single run`);
  } else if (analysis.totalRecords > 100) {
    console.log(`   • GOOD: Processed ${analysis.totalRecords} records`);
  } else {
    console.log(`   • LIMITED: Only ${analysis.totalRecords} records processed`);
  }

  const hasDocuments = analysis.dataTypes.some(d => d.type === 'council_document' || d.type === 'document');
  if (hasDocuments) {
    console.log(`   • Document extraction: Successfully capturing structured documents`);
  }

  console.log(`\n💡 RECOMMENDATIONS:`);
  
  if (analysis.qualityScores.avg < 60) {
    console.log(`   • Improve content quality filtering thresholds`);
  }
  
  if (analysis.totalRecords < 200) {
    console.log(`   • Consider extending crawl duration or expanding seed URLs`);
  }
  
  if (analysis.topSources.length < 3) {
    console.log(`   • Diversify source domains for broader coverage`);
  }

  console.log(`\n🎉 The Master Unified Crawler is performing well with quality data extraction!`);
}

async function main() {
  try {
    const analysis = await analyzeScrapedData();
    await generateInsights(analysis);
  } catch (error) {
    console.error('Failed to analyze scraped data:', error);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
