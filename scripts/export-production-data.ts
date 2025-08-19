import 'dotenv/config';
import { storage } from '../server/storage.js';
import * as fs from 'fs/promises';
import * as path from 'path';

async function exportProductionData() {
  console.log('📦 EXPORTING COMPREHENSIVE DATA FOR PRODUCTION DEPLOYMENT');
  console.log('🎯 Creating production-ready data package...');
  
  try {
    // Create export directory
    const exportDir = './production-export';
    await fs.rm(exportDir, { recursive: true, force: true });
    await fs.mkdir(exportDir, { recursive: true });
    
    // Get all collected data
    console.log('\n📊 Retrieving comprehensive data from database...');
    const allData = await storage.getCouncilData(undefined, 1000);
    
    console.log(`✅ Retrieved ${allData.length} records from database`);
    
    // Group data by type for organized export
    const dataByType = allData.reduce((acc, item) => {
      if (!acc[item.dataType]) {
        acc[item.dataType] = [];
      }
      acc[item.dataType].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    
    console.log('\n📋 Data Summary:');
    Object.entries(dataByType).forEach(([type, items]) => {
      console.log(`   • ${type}: ${items.length} records`);
    });
    
    // Export data by type
    console.log('\n📁 Creating organized export files...');
    for (const [dataType, items] of Object.entries(dataByType)) {\n      const fileName = `${dataType}_data.json`;\n      const filePath = path.join(exportDir, fileName);\n      await fs.writeFile(filePath, JSON.stringify(items, null, 2));\n      console.log(`💾 ${fileName}: ${items.length} records`);\n    }\n    \n    // Create a comprehensive export file\n    const comprehensiveExport = {\n      metadata: {\n        exportDate: new Date().toISOString(),\n        totalRecords: allData.length,\n        dataTypes: Object.keys(dataByType),\n        summary: Object.entries(dataByType).map(([type, items]) => ({\n          type,\n          count: items.length\n        }))\n      },\n      data: allData\n    };\n    \n    await fs.writeFile(\n      path.join(exportDir, 'comprehensive_export.json'),\n      JSON.stringify(comprehensiveExport, null, 2)\n    );\n    \n    // Create SQL insert statements for easy production import\n    console.log('\n🗄️ Generating SQL import script...');\n    const sqlStatements = [];\n    \n    for (const record of allData) {\n      const values = [\n        `'${record.id}'`,\n        `'${record.title.replace(/'/g, \"''\")}'`,\n        record.description ? `'${record.description.replace(/'/g, \"''\")}'` : 'NULL',\n        `'${record.dataType}'`,\n        record.sourceUrl ? `'${record.sourceUrl}'` : 'NULL',\n        record.amount ? record.amount : 'NULL',\n        record.status ? `'${record.status.replace(/'/g, \"''\")}'` : 'NULL',\n        `'${record.date.toISOString()}'`,\n        record.location ? `'${record.location.replace(/'/g, \"''\")}'` : 'NULL',\n        record.metadata ? `'${JSON.stringify(record.metadata).replace(/'/g, \"''\")}'` : 'NULL',\n        `'${record.createdAt.toISOString()}'`\n      ];\n      \n      sqlStatements.push(\n        `INSERT INTO council_data (id, title, description, data_type, source_url, amount, status, date, location, metadata, created_at) VALUES (${values.join(', ')});`\n      );\n    }\n    \n    await fs.writeFile(\n      path.join(exportDir, 'import_data.sql'),\n      sqlStatements.join('\\n')\n    );\n    \n    // Copy comprehensive JSON files\n    console.log('\\n📂 Copying comprehensive JSON files...');\n    const jsonDir = path.join(exportDir, 'json_files');\n    await fs.mkdir(jsonDir, { recursive: true });\n    \n    try {\n      const comprehensiveFiles = await fs.readdir('./scraped_data_comprehensive');\n      for (const file of comprehensiveFiles) {\n        await fs.copyFile(\n          path.join('./scraped_data_comprehensive', file),\n          path.join(jsonDir, file)\n        );\n      }\n      console.log(`📁 Copied ${comprehensiveFiles.length} JSON files`);\n    } catch (error) {\n      console.log('⚠️ No comprehensive JSON files found (may have been cleaned up)');\n    }\n    \n    // Create deployment instructions\n    const deploymentInstructions = `# StonecloughHub Production Deployment Package\n\n## 📊 Data Summary\nTotal Records: ${allData.length}\nExport Date: ${new Date().toISOString()}\n\n## 📋 Data Types Included:\n${Object.entries(dataByType).map(([type, items]) => `- ${type}: ${items.length} records`).join('\\n')}\n\n## 🚀 Deployment Options\n\n### Option 1: Database Import (Recommended)\n1. Use the SQL script: \\`import_data.sql\\`\n2. Run against your production database\n3. Verify data integrity\n\n### Option 2: API Import\n1. Use the JSON files in individual type files\n2. POST to your production API endpoints\n3. Import by data type for better control\n\n### Option 3: Comprehensive Import\n1. Use \\`comprehensive_export.json\\`\n2. Process through your app's import system\n3. Full dataset with metadata\n\n## 📁 Files Included\n- \\`comprehensive_export.json\\` - Complete dataset with metadata\n- \\`import_data.sql\\` - Ready-to-run SQL import script\n- Individual JSON files by data type\n- \\`json_files/\\` - Raw scraped JSON files\n\n## 🔧 Production Setup\n1. Deploy your application code\n2. Run database migrations\n3. Import data using preferred method above\n4. Verify data in production\n5. Set up ongoing scraper schedule\n\n## 📈 Next Steps\n- Set up automated scraper runs (daily/weekly)\n- Monitor data quality\n- Add new data sources as needed\n- Configure chart refreshes\n\n---\nGenerated by StonecloughHub Enhanced Scraper System\n`;\n    \n    await fs.writeFile(\n      path.join(exportDir, 'DEPLOYMENT_INSTRUCTIONS.md'),\n      deploymentInstructions\n    );\n    \n    // Create summary report\n    const summaryReport = {\n      export: {\n        date: new Date().toISOString(),\n        totalRecords: allData.length,\n        filesCreated: Object.keys(dataByType).length + 3, // +3 for comprehensive, SQL, instructions\n        compressionReady: true\n      },\n      dataQuality: {\n        recordsWithTitles: allData.filter(r => r.title && r.title.length > 0).length,\n        recordsWithDescriptions: allData.filter(r => r.description && r.description.length > 0).length,\n        recordsWithMetadata: allData.filter(r => r.metadata && Object.keys(r.metadata).length > 0).length,\n        recentRecords: allData.filter(r => new Date(r.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length\n      },\n      readyForProduction: true\n    };\n    \n    await fs.writeFile(\n      path.join(exportDir, 'export_summary.json'),\n      JSON.stringify(summaryReport, null, 2)\n    );\n    \n    console.log('\\n🎉 PRODUCTION EXPORT COMPLETE!');\n    console.log(`📁 Export Location: ${exportDir}/`);\n    console.log('\\n📋 Files Created:');\n    console.log('   • comprehensive_export.json - Complete dataset');\n    console.log('   • import_data.sql - SQL import script');\n    console.log('   • Individual JSON files by data type');\n    console.log('   • DEPLOYMENT_INSTRUCTIONS.md');\n    console.log('   • export_summary.json');\n    console.log('   • json_files/ directory with raw files');\n    \n    console.log('\\n🚀 READY FOR PRODUCTION DEPLOYMENT!');\n    console.log('📖 See DEPLOYMENT_INSTRUCTIONS.md for setup guidance');\n    \n  } catch (error) {\n    console.error('❌ Export failed:', error);\n    throw error;\n  }\n}\n\n// Run the export\nexportProductionData().catch(error => {\n  console.error('Fatal export error:', error);\n  process.exit(1);\n});
