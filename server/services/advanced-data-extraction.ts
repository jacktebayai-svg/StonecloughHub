import * as cheerio from 'cheerio';
import { ComprehensiveMonitor } from './monitoring-system';
import { storage } from '../storage';
import { InsertCouncilData } from '@shared/schema';
import crypto from 'crypto';

export interface ExtractionResult {
  primaryData: ExtractedEntity[];
  metadata: ExtractionMetadata;
  structuredData: StructuredDataPoint[];
  relationships: EntityRelationship[];
  semanticTags: string[];
  qualityScore: number;
  confidence: number;
  processingTime: number;
}

export interface ExtractedEntity {
  id: string;
  type: EntityType;
  title: string;
  description?: string;
  data: Record<string, any>;
  source: EntitySource;
  confidence: number;
  lastUpdated: Date;
  validation: ValidationResult;
}

export interface ExtractionMetadata {
  url: string;
  contentType: string;
  contentLength: number;
  extractionMethod: string;
  timestamp: Date;
  version: string;
  checksum: string;
  language?: string;
  encoding?: string;
}

export interface StructuredDataPoint {
  key: string;
  value: any;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'object' | 'array';
  source: 'html' | 'json-ld' | 'microdata' | 'table' | 'form' | 'api' | 'derived';
  confidence: number;
  context?: string;
}

export interface EntityRelationship {
  sourceId: string;
  targetId: string;
  relationshipType: 'contains' | 'references' | 'related_to' | 'part_of' | 'authored_by' | 'dated';
  confidence: number;
  evidence: string;
}

export interface EntitySource {
  url: string;
  selector?: string;
  xpath?: string;
  extractionRule: string;
  timestamp: Date;
}

export interface ValidationResult {
  isValid: boolean;
  completeness: number; // 0-1
  consistency: number; // 0-1
  accuracy: number; // 0-1
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  field: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion?: string;
}

export type EntityType = 
  | 'council_meeting'
  | 'planning_application'
  | 'councillor'
  | 'budget_item'
  | 'policy_document'
  | 'service_info'
  | 'transparency_data'
  | 'consultation'
  | 'contact_info'
  | 'event'
  | 'location'
  | 'organization'
  | 'person'
  | 'financial_data';

export class AdvancedDataExtractor {
  private monitor: ComprehensiveMonitor;
  private extractionRules: Map<EntityType, ExtractionRule[]>;
  private semanticAnalyzer: SemanticAnalyzer;
  private validationEngine: ValidationEngine;
  private formatProcessors: Map<string, FormatProcessor>;

  constructor() {
    this.monitor = new ComprehensiveMonitor();
    this.extractionRules = new Map();
    this.semanticAnalyzer = new SemanticAnalyzer();
    this.validationEngine = new ValidationEngine();
    this.formatProcessors = new Map();
    
    this.initializeExtractionRules();
    this.initializeFormatProcessors();
  }

  /**
   * Extract data from content with AI-powered analysis
   */
  async extractData(
    content: string,
    url: string,
    contentType: string = 'text/html',
    options: ExtractionOptions = {}
  ): Promise<ExtractionResult> {
    const timingId = this.monitor.startTiming('data_extraction');
    const startTime = Date.now();

    try {
      console.log(`🧠 Extracting data from: ${url} (${contentType})`);

      // 1. Detect content format and select appropriate processor
      const processor = this.getFormatProcessor(contentType);
      if (!processor) {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      // 2. Process content and extract raw data
      const rawData = await processor.process(content, url);

      // 3. Apply extraction rules based on content analysis
      const entities = await this.applyExtractionRules(rawData, url, contentType);

      // 4. Perform semantic analysis and enhancement
      const enhancedEntities = await this.semanticAnalyzer.enhance(entities, content, url);

      // 5. Extract relationships between entities
      const relationships = await this.extractRelationships(enhancedEntities, content);

      // 6. Extract structured data points
      const structuredData = await this.extractStructuredData(rawData, content, url);

      // 7. Generate semantic tags
      const semanticTags = await this.semanticAnalyzer.generateTags(content, enhancedEntities);

      // 8. Validate extracted data
      const validatedEntities = await this.validationEngine.validateEntities(enhancedEntities);

      // 9. Calculate quality scores
      const qualityScore = this.calculateQualityScore(validatedEntities, structuredData);
      const confidence = this.calculateConfidence(validatedEntities, relationships);

      // 10. Generate metadata
      const metadata: ExtractionMetadata = {
        url,
        contentType,
        contentLength: content.length,
        extractionMethod: 'advanced_ai_extraction',
        timestamp: new Date(),
        version: '2.0.0',
        checksum: crypto.createHash('md5').update(content).digest('hex'),
        language: this.detectLanguage(content),
        encoding: 'utf-8'
      };

      const result: ExtractionResult = {
        primaryData: validatedEntities,
        metadata,
        structuredData,
        relationships,
        semanticTags,
        qualityScore,
        confidence,
        processingTime: Date.now() - startTime
      };

      this.monitor.endTiming(timingId, 'data_extraction', true, {
        entitiesExtracted: validatedEntities.length,
        relationshipsFound: relationships.length,
        qualityScore,
        confidence
      });

      console.log(`✅ Data extraction completed: ${validatedEntities.length} entities, quality: ${Math.round(qualityScore * 100)}%`);

      return result;

    } catch (error) {
      this.monitor.endTiming(timingId, 'data_extraction', false);
      this.monitor.recordError(error as Error, {
        operation: 'data_extraction',
        url,
        timestamp: new Date(),
        metadata: { contentType, contentLength: content.length }
      });
      throw error;
    }
  }

  /**
   * Initialize extraction rules for different entity types
   */
  private initializeExtractionRules(): void {
    // Council Meeting Rules
    this.extractionRules.set('council_meeting', [
      {
        name: 'meeting_title',
        selectors: ['h1', '.meeting-title', '.agenda-title', 'title'],
        patterns: [/committee\s+meeting/i, /council\s+meeting/i, /agenda/i],
        required: true,
        weight: 10
      },
      {
        name: 'meeting_date',
        selectors: ['.meeting-date', '.date', 'time[datetime]'],
        patterns: [/\d{1,2}[\s\/\-]\w{3,9}[\s\/\-]\d{4}/i, /\d{4}-\d{2}-\d{2}/],
        required: true,
        weight: 9,
        transform: 'parseDate'
      },
      {
        name: 'agenda_items',
        selectors: ['.agenda-item', '.item', 'ol li', 'ul li'],
        patterns: [/^\d+\.?\s+/],
        required: false,
        weight: 8,
        multiple: true
      },
      {
        name: 'committee_name',
        selectors: ['.committee', '.meeting-type', 'h2'],
        patterns: [/committee$/i, /board$/i, /panel$/i],
        required: false,
        weight: 7
      }
    ]);

    // Planning Application Rules
    this.extractionRules.set('planning_application', [
      {
        name: 'application_number',
        selectors: ['.app-number', '.reference', '[data-ref]'],
        patterns: [/\d{2}\/\d{5}\/[A-Z]+/i, /[A-Z]{2}\d{8}/i],
        required: true,
        weight: 10
      },
      {
        name: 'application_address',
        selectors: ['.address', '.property', '.site'],
        patterns: [/\d+\s+[A-Za-z\s,]+[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}/],
        required: true,
        weight: 9
      },
      {
        name: 'proposal',
        selectors: ['.proposal', '.description', '.development'],
        required: true,
        weight: 8
      },
      {
        name: 'status',
        selectors: ['.status', '.decision', '.outcome'],
        patterns: [/pending|approved|refused|withdrawn/i],
        required: false,
        weight: 7
      }
    ]);

    // Financial Data Rules
    this.extractionRules.set('budget_item', [
      {
        name: 'budget_category',
        selectors: ['.category', '.department', 'th', '.budget-line'],
        required: true,
        weight: 10
      },
      {
        name: 'amount',
        selectors: ['.amount', '.cost', '.budget', '.value'],
        patterns: [/£[\d,]+\.?\d*/i, /\d+\.?\d*\s*million/i],
        required: true,
        weight: 10,
        transform: 'parseAmount'
      },
      {
        name: 'budget_year',
        selectors: ['.year', '.financial-year', '.period'],
        patterns: [/20\d{2}[-\/]?20?\d{2}/],
        required: false,
        weight: 6
      }
    ]);

    // Add more rules for other entity types...
  }

  /**
   * Initialize format processors for different content types
   */
  private initializeFormatProcessors(): void {
    this.formatProcessors.set('text/html', new HtmlProcessor());
    this.formatProcessors.set('application/json', new JsonProcessor());
    this.formatProcessors.set('application/xml', new XmlProcessor());
    this.formatProcessors.set('text/xml', new XmlProcessor());
    this.formatProcessors.set('application/pdf', new PdfProcessor());
    this.formatProcessors.set('text/csv', new CsvProcessor());
    this.formatProcessors.set('application/vnd.ms-excel', new ExcelProcessor());
  }

  /**
   * Get appropriate format processor
   */
  private getFormatProcessor(contentType: string): FormatProcessor | null {
    // Extract main type
    const mainType = contentType.split(';')[0].toLowerCase();
    return this.formatProcessors.get(mainType) || null;
  }

  /**
   * Apply extraction rules to raw data
   */
  private async applyExtractionRules(
    rawData: RawData,
    url: string,
    contentType: string
  ): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = [];
    const $ = rawData.dom || cheerio.load('');

    // Determine likely entity types based on content analysis
    const likelyTypes = this.inferEntityTypes(rawData, url);

    for (const entityType of likelyTypes) {
      const rules = this.extractionRules.get(entityType) || [];
      const extractedData = await this.extractEntityData($, rules, rawData);

      if (this.meetsMinimumRequirements(extractedData, rules)) {
        const entity: ExtractedEntity = {
          id: crypto.randomUUID(),
          type: entityType,
          title: this.generateEntityTitle(extractedData, entityType),
          description: extractedData.description || undefined,
          data: extractedData,
          source: {
            url,
            extractionRule: entityType,
            timestamp: new Date()
          },
          confidence: this.calculateEntityConfidence(extractedData, rules),
          lastUpdated: new Date(),
          validation: { isValid: true, completeness: 0, consistency: 0, accuracy: 0, issues: [] }
        };

        entities.push(entity);
      }
    }

    return entities;
  }

  /**
   * Extract structured data points from various sources
   */
  private async extractStructuredData(
    rawData: RawData,
    content: string,
    url: string
  ): Promise<StructuredDataPoint[]> {
    const structuredData: StructuredDataPoint[] = [];
    const $ = rawData.dom || cheerio.load('');

    // Extract from JSON-LD
    if (rawData.jsonLd) {
      rawData.jsonLd.forEach((item, index) => {
        this.processJsonLdItem(item, structuredData, `jsonld_${index}`);
      });
    }

    // Extract from microdata
    $('[itemscope]').each((_, element) => {
      const microdata = this.extractMicrodata($, $(element));
      Object.entries(microdata).forEach(([key, value]) => {
        structuredData.push({
          key,
          value,
          dataType: this.inferDataType(value),
          source: 'microdata',
          confidence: 0.8,
          context: $(element).attr('itemtype') || undefined
        });
      });
    });

    // Extract from tables
    $('table').each((tableIndex, table) => {
      const tableData = this.extractTableData($, $(table));
      tableData.forEach((row, rowIndex) => {
        Object.entries(row).forEach(([key, value]) => {
          structuredData.push({
            key: `table_${tableIndex}_${key}`,
            value,
            dataType: this.inferDataType(value),
            source: 'table',
            confidence: 0.7,
            context: `Table ${tableIndex + 1}, Row ${rowIndex + 1}`
          });
        });
      });
    });

    // Extract from forms
    $('form').each((formIndex, form) => {
      $(form).find('input, select, textarea').each((_, field) => {
        const name = $(field).attr('name');
        const value = $(field).attr('value') || $(field).text();
        const label = this.findFieldLabel($, $(field));

        if (name && value) {
          structuredData.push({
            key: `form_${formIndex}_${name}`,
            value,
            dataType: this.inferDataType(value),
            source: 'form',
            confidence: 0.6,
            context: label || `Form ${formIndex + 1}`
          });
        }
      });
    });

    return structuredData;
  }

  /**
   * Extract relationships between entities
   */
  private async extractRelationships(
    entities: ExtractedEntity[],
    content: string
  ): Promise<EntityRelationship[]> {
    const relationships: EntityRelationship[] = [];

    // Find direct references between entities
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const relationship = this.analyzeEntityRelationship(entities[i], entities[j], content);
        if (relationship) {
          relationships.push(relationship);
        }
      }
    }

    return relationships;
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(
    entities: ExtractedEntity[],
    structuredData: StructuredDataPoint[]
  ): number {
    if (entities.length === 0) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    entities.forEach(entity => {
      const score = (entity.validation.completeness + entity.validation.consistency + entity.validation.accuracy) / 3;
      const weight = entity.confidence;
      totalScore += score * weight;
      totalWeight += weight;
    });

    const entityScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    const structuredDataBonus = Math.min(0.2, structuredData.length * 0.01);

    return Math.max(0, Math.min(1, entityScore + structuredDataBonus));
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    entities: ExtractedEntity[],
    relationships: EntityRelationship[]
  ): number {
    if (entities.length === 0) return 0;

    const avgEntityConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
    const relationshipBonus = Math.min(0.1, relationships.length * 0.02);
    
    return Math.max(0, Math.min(1, avgEntityConfidence + relationshipBonus));
  }

  // Helper methods and utilities

  private inferEntityTypes(rawData: RawData, url: string): EntityType[] {
    const types: EntityType[] = [];
    const content = rawData.textContent?.toLowerCase() || '';
    const urlLower = url.toLowerCase();

    // URL-based inference
    if (urlLower.includes('meeting') || urlLower.includes('agenda')) types.push('council_meeting');
    if (urlLower.includes('planning') || urlLower.includes('application')) types.push('planning_application');
    if (urlLower.includes('budget') || urlLower.includes('finance')) types.push('budget_item');
    if (urlLower.includes('councillor') || urlLower.includes('member')) types.push('councillor');

    // Content-based inference
    if (content.includes('agenda item') || content.includes('committee')) types.push('council_meeting');
    if (content.includes('planning application') || content.includes('planning permission')) types.push('planning_application');
    if (content.includes('£') || content.includes('budget')) types.push('budget_item');
    if (content.includes('councillor') || content.includes('ward')) types.push('councillor');

    // Default fallback
    if (types.length === 0) types.push('service_info');

    return types;
  }

  private async extractEntityData(
    $: cheerio.CheerioAPI,
    rules: ExtractionRule[],
    rawData: RawData
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    for (const rule of rules) {
      let value = null;

      // Try each selector
      for (const selector of rule.selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          value = rule.multiple 
            ? elements.map((_, el) => $(el).text().trim()).get()
            : elements.first().text().trim();
          
          if (value && (typeof value === 'string' ? value.length > 0 : value.length > 0)) {
            break;
          }
        }
      }

      // Apply patterns if specified
      if (value && rule.patterns) {
        const matched = rule.patterns.some(pattern => {
          if (typeof value === 'string') {
            return pattern.test(value);
          } else if (Array.isArray(value)) {
            return value.some(v => pattern.test(v));
          }
          return false;
        });
        
        if (!matched) value = null;
      }

      // Apply transforms if specified
      if (value && rule.transform) {
        value = this.applyTransform(value, rule.transform);
      }

      if (value !== null) {
        data[rule.name] = value;
      }
    }

    return data;
  }

  private meetsMinimumRequirements(data: Record<string, any>, rules: ExtractionRule[]): boolean {
    const requiredRules = rules.filter(rule => rule.required);
    return requiredRules.every(rule => data[rule.name] !== undefined);
  }

  private generateEntityTitle(data: Record<string, any>, entityType: EntityType): string {
    switch (entityType) {
      case 'council_meeting':
        return data.meeting_title || `Meeting - ${data.committee_name || 'Unknown'}`;
      case 'planning_application':
        return `Planning Application ${data.application_number || 'Unknown'}`;
      case 'budget_item':
        return `Budget: ${data.budget_category || 'Unknown Category'}`;
      case 'councillor':
        return `Councillor ${data.name || 'Unknown'}`;
      default:
        return Object.values(data)[0] as string || `${entityType} - Unknown`;
    }
  }

  private calculateEntityConfidence(data: Record<string, any>, rules: ExtractionRule[]): number {
    let totalWeight = 0;
    let matchedWeight = 0;

    rules.forEach(rule => {
      totalWeight += rule.weight;
      if (data[rule.name] !== undefined) {
        matchedWeight += rule.weight;
      }
    });

    return totalWeight > 0 ? matchedWeight / totalWeight : 0;
  }

  private processJsonLdItem(item: any, structuredData: StructuredDataPoint[], context: string): void {
    Object.entries(item).forEach(([key, value]) => {
      structuredData.push({
        key: `${context}_${key}`,
        value,
        dataType: this.inferDataType(value),
        source: 'json-ld',
        confidence: 0.9,
        context
      });
    });
  }

  private extractMicrodata($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): Record<string, any> {
    const data: Record<string, any> = {};
    
    element.find('[itemprop]').each((_, propEl) => {
      const prop = $(propEl).attr('itemprop');
      const value = $(propEl).attr('content') || $(propEl).text().trim();
      if (prop && value) {
        data[prop] = value;
      }
    });

    return data;
  }

  private extractTableData($: cheerio.CheerioAPI, table: cheerio.Cheerio<any>): Record<string, string>[] {
    const data: Record<string, string>[] = [];
    const headers: string[] = [];

    // Extract headers
    table.find('th').each((_, th) => {
      headers.push($(th).text().trim());
    });

    // Extract rows
    table.find('tr').each((_, tr) => {
      const rowData: Record<string, string> = {};
      $(tr).find('td').each((index, td) => {
        const header = headers[index] || `column_${index}`;
        rowData[header] = $(td).text().trim();
      });
      
      if (Object.values(rowData).some(value => value.length > 0)) {
        data.push(rowData);
      }
    });

    return data;
  }

  private findFieldLabel($: cheerio.CheerioAPI, field: cheerio.Cheerio<any>): string | undefined {
    const fieldId = field.attr('id');
    const fieldName = field.attr('name');

    // Try label[for="id"]
    if (fieldId) {
      const label = $(`label[for="${fieldId}"]`).text().trim();
      if (label) return label;
    }

    // Try preceding label
    const prevLabel = field.prev('label').text().trim();
    if (prevLabel) return prevLabel;

    // Try parent label
    const parentLabel = field.closest('label').text().trim();
    if (parentLabel) return parentLabel;

    return fieldName;
  }

  private analyzeEntityRelationship(
    entity1: ExtractedEntity,
    entity2: ExtractedEntity,
    content: string
  ): EntityRelationship | null {
    // Look for direct references
    const entity1Keywords = this.extractEntityKeywords(entity1);
    const entity2Keywords = this.extractEntityKeywords(entity2);

    let relationshipType: EntityRelationship['relationshipType'] | null = null;
    let confidence = 0;
    let evidence = '';

    // Check if one entity contains references to another
    entity1Keywords.forEach(keyword => {
      if (entity2.title.toLowerCase().includes(keyword.toLowerCase()) ||
          JSON.stringify(entity2.data).toLowerCase().includes(keyword.toLowerCase())) {
        relationshipType = 'references';
        confidence = 0.7;
        evidence = `Entity 1 contains reference to "${keyword}"`;
      }
    });

    entity2Keywords.forEach(keyword => {
      if (entity1.title.toLowerCase().includes(keyword.toLowerCase()) ||
          JSON.stringify(entity1.data).toLowerCase().includes(keyword.toLowerCase())) {
        relationshipType = 'references';
        confidence = 0.7;
        evidence = `Entity 2 contains reference to "${keyword}"`;
      }
    });

    // Check for temporal relationships
    const date1 = this.extractDate(entity1);
    const date2 = this.extractDate(entity2);
    if (date1 && date2 && Math.abs(date1.getTime() - date2.getTime()) < 7 * 24 * 60 * 60 * 1000) {
      relationshipType = 'related_to';
      confidence = 0.6;
      evidence = 'Entities have similar dates';
    }

    if (relationshipType) {
      return {
        sourceId: entity1.id,
        targetId: entity2.id,
        relationshipType,
        confidence,
        evidence
      };
    }

    return null;
  }

  private extractEntityKeywords(entity: ExtractedEntity): string[] {
    const keywords = [];
    
    // Extract from title
    const titleWords = entity.title.split(/\W+/).filter(word => word.length > 3);
    keywords.push(...titleWords);

    // Extract significant values from data
    Object.values(entity.data).forEach(value => {
      if (typeof value === 'string' && value.length > 0 && value.length < 50) {
        keywords.push(...value.split(/\W+/).filter(word => word.length > 3));
      }
    });

    return [...new Set(keywords)];
  }

  private extractDate(entity: ExtractedEntity): Date | null {
    // Look for date fields in entity data
    for (const [key, value] of Object.entries(entity.data)) {
      if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
        try {
          return new Date(value as string);
        } catch {
          // Invalid date, continue
        }
      }
    }

    return null;
  }

  private inferDataType(value: any): StructuredDataPoint['dataType'] {
    if (typeof value === 'string') {
      if (!isNaN(Number(value))) return 'number';
      if (value === 'true' || value === 'false') return 'boolean';
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
      return 'string';
    }
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'string';
  }

  private applyTransform(value: any, transform: string): any {
    switch (transform) {
      case 'parseDate':
        try {
          return new Date(value).toISOString();
        } catch {
          return value;
        }
      case 'parseAmount':
        if (typeof value === 'string') {
          const match = value.match(/[\d,]+\.?\d*/);
          return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
        }
        return value;
      default:
        return value;
    }
  }

  private detectLanguage(content: string): string {
    // Simple language detection - could be enhanced
    const englishWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'had', 'day'];
    const words = content.toLowerCase().split(/\W+/);
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    return englishCount > words.length * 0.05 ? 'en' : 'unknown';
  }
}

// Supporting classes and interfaces

interface ExtractionRule {
  name: string;
  selectors: string[];
  patterns?: RegExp[];
  required: boolean;
  weight: number;
  multiple?: boolean;
  transform?: string;
}

interface ExtractionOptions {
  entityTypes?: EntityType[];
  maxEntities?: number;
  requireValidation?: boolean;
  semanticAnalysis?: boolean;
}

interface RawData {
  textContent?: string;
  dom?: cheerio.CheerioAPI;
  jsonLd?: any[];
  metadata?: Record<string, any>;
}

// Format processors
abstract class FormatProcessor {
  abstract process(content: string, url: string): Promise<RawData>;
}

class HtmlProcessor extends FormatProcessor {
  async process(content: string, url: string): Promise<RawData> {
    const $ = cheerio.load(content);
    const jsonLd: any[] = [];

    // Extract JSON-LD
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const data = JSON.parse($(element).html() || '{}');
        jsonLd.push(data);
      } catch {
        // Invalid JSON, skip
      }
    });

    return {
      textContent: $.text(),
      dom: $,
      jsonLd,
      metadata: {
        title: $('title').text(),
        description: $('meta[name="description"]').attr('content'),
        keywords: $('meta[name="keywords"]').attr('content')
      }
    };
  }
}

class JsonProcessor extends FormatProcessor {
  async process(content: string, url: string): Promise<RawData> {
    try {
      const data = JSON.parse(content);
      return {
        textContent: JSON.stringify(data),
        metadata: data
      };
    } catch (error) {
      throw new Error('Invalid JSON content');
    }
  }
}

class XmlProcessor extends FormatProcessor {
  async process(content: string, url: string): Promise<RawData> {
    const $ = cheerio.load(content, { xmlMode: true });
    return {
      textContent: $.text(),
      dom: $,
      metadata: {}
    };
  }
}

class PdfProcessor extends FormatProcessor {
  async process(content: string, url: string): Promise<RawData> {
    // PDF processing would require additional libraries like pdf-parse
    // For now, return minimal data
    return {
      textContent: 'PDF content extraction not yet implemented',
      metadata: { contentType: 'application/pdf', url }
    };
  }
}

class CsvProcessor extends FormatProcessor {
  async process(content: string, url: string): Promise<RawData> {
    const lines = content.split('\n');
    const headers = lines[0]?.split(',') || [];
    const rows = lines.slice(1).map(line => {
      const values = line.split(',');
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      return row;
    });

    return {
      textContent: content,
      metadata: { headers, rows, format: 'csv' }
    };
  }
}

class ExcelProcessor extends FormatProcessor {
  async process(content: string, url: string): Promise<RawData> {
    // Excel processing would require additional libraries
    return {
      textContent: 'Excel content extraction not yet implemented',
      metadata: { contentType: 'application/vnd.ms-excel', url }
    };
  }
}

// Semantic Analysis Engine
class SemanticAnalyzer {
  async enhance(entities: ExtractedEntity[], content: string, url: string): Promise<ExtractedEntity[]> {
    // Add semantic enhancements to entities
    return entities.map(entity => {
      entity.data.semanticContext = this.analyzeContext(entity, content);
      entity.data.relevanceScore = this.calculateRelevance(entity, content);
      return entity;
    });
  }

  async generateTags(content: string, entities: ExtractedEntity[]): Promise<string[]> {
    const tags = new Set<string>();
    
    // Extract tags from entities
    entities.forEach(entity => {
      tags.add(entity.type);
      // Add other relevant tags based on entity data
    });

    // Add content-based tags
    const contentTags = this.extractContentTags(content);
    contentTags.forEach(tag => tags.add(tag));

    return Array.from(tags);
  }

  private analyzeContext(entity: ExtractedEntity, content: string): Record<string, any> {
    return {
      contextualRelevance: this.calculateContextualRelevance(entity, content),
      semanticSimilarity: this.findSimilarEntities(entity, content),
      topicCategory: this.categorizeByTopic(entity)
    };
  }

  private calculateRelevance(entity: ExtractedEntity, content: string): number {
    // Simple relevance calculation based on entity presence in content
    const entityKeywords = entity.title.split(/\W+/);
    const contentLower = content.toLowerCase();
    
    let relevanceScore = 0;
    entityKeywords.forEach(keyword => {
      if (keyword.length > 3 && contentLower.includes(keyword.toLowerCase())) {
        relevanceScore++;
      }
    });

    return Math.min(1, relevanceScore / Math.max(1, entityKeywords.length));
  }

  private calculateContextualRelevance(entity: ExtractedEntity, content: string): number {
    // More sophisticated contextual relevance calculation
    return 0.7; // Placeholder
  }

  private findSimilarEntities(entity: ExtractedEntity, content: string): any[] {
    // Find semantically similar entities
    return []; // Placeholder
  }

  private categorizeByTopic(entity: ExtractedEntity): string {
    // Categorize entity by topic/theme
    const typeTopicMap = {
      'council_meeting': 'governance',
      'planning_application': 'development',
      'budget_item': 'finance',
      'councillor': 'people',
      'policy_document': 'policy'
    };

    return typeTopicMap[entity.type] || 'general';
  }

  private extractContentTags(content: string): string[] {
    // Extract meaningful tags from content
    const words = content.toLowerCase().split(/\W+/);
    const importantWords = words.filter(word => 
      word.length > 4 && 
      !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said'].includes(word)
    );

    // Count frequency and return top words as tags
    const wordCount = new Map<string, number>();
    importantWords.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return Array.from(wordCount.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }
}

// Validation Engine
class ValidationEngine {
  async validateEntities(entities: ExtractedEntity[]): Promise<ExtractedEntity[]> {
    return entities.map(entity => {
      entity.validation = this.validateEntity(entity);
      return entity;
    });
  }

  private validateEntity(entity: ExtractedEntity): ValidationResult {
    const issues: ValidationIssue[] = [];
    
    // Check completeness
    const requiredFields = this.getRequiredFields(entity.type);
    const completeness = this.calculateCompleteness(entity, requiredFields, issues);
    
    // Check consistency
    const consistency = this.checkConsistency(entity, issues);
    
    // Check accuracy
    const accuracy = this.checkAccuracy(entity, issues);
    
    return {
      isValid: issues.filter(i => i.severity === 'critical').length === 0,
      completeness,
      consistency,
      accuracy,
      issues
    };
  }

  private getRequiredFields(entityType: EntityType): string[] {
    const requiredFieldsMap = {
      'council_meeting': ['meeting_title', 'meeting_date'],
      'planning_application': ['application_number', 'application_address'],
      'budget_item': ['budget_category', 'amount'],
      'councillor': ['name', 'ward'],
      'policy_document': ['title', 'date']
    };

    return requiredFieldsMap[entityType] || [];
  }

  private calculateCompleteness(entity: ExtractedEntity, requiredFields: string[], issues: ValidationIssue[]): number {
    let completed = 0;
    
    requiredFields.forEach(field => {
      if (entity.data[field] !== undefined && entity.data[field] !== null && entity.data[field] !== '') {
        completed++;
      } else {
        issues.push({
          field,
          severity: 'high',
          message: `Required field '${field}' is missing`,
          suggestion: `Please provide a value for '${field}'`
        });
      }
    });

    return requiredFields.length > 0 ? completed / requiredFields.length : 1;
  }

  private checkConsistency(entity: ExtractedEntity, issues: ValidationIssue[]): number {
    let consistencyScore = 1.0;

    // Check date consistency
    Object.entries(entity.data).forEach(([key, value]) => {
      if (key.toLowerCase().includes('date')) {
        try {
          const date = new Date(value as string);
          const now = new Date();
          if (date > now) {
            issues.push({
              field: key,
              severity: 'medium',
              message: `Date '${value}' is in the future`,
              suggestion: 'Verify the date is correct'
            });
            consistencyScore -= 0.1;
          }
        } catch {
          issues.push({
            field: key,
            severity: 'medium',
            message: `Invalid date format: '${value}'`,
            suggestion: 'Use a standard date format'
          });
          consistencyScore -= 0.2;
        }
      }
    });

    return Math.max(0, consistencyScore);
  }

  private checkAccuracy(entity: ExtractedEntity, issues: ValidationIssue[]): number {
    let accuracyScore = entity.confidence;

    // Perform basic accuracy checks
    Object.entries(entity.data).forEach(([key, value]) => {
      if (key.toLowerCase().includes('email') && typeof value === 'string') {
        if (!value.includes('@') || !value.includes('.')) {
          issues.push({
            field: key,
            severity: 'high',
            message: `Invalid email format: '${value}'`,
            suggestion: 'Check email address format'
          });
          accuracyScore -= 0.2;
        }
      }

      if (key.toLowerCase().includes('phone') && typeof value === 'string') {
        if (!/\d/.test(value)) {
          issues.push({
            field: key,
            severity: 'medium',
            message: `Phone number seems invalid: '${value}'`,
            suggestion: 'Verify phone number format'
          });
          accuracyScore -= 0.1;
        }
      }
    });

    return Math.max(0, accuracyScore);
  }
}

export const advancedDataExtractor = new AdvancedDataExtractor();
