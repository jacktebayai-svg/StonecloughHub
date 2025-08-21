import * as pdf2pic from 'pdf2pic';
import { z } from 'zod';
import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

// Lazy-loaded pdf-parse to avoid startup issues
let pdfParse: any = null;
async function getPdfParse() {
  if (!pdfParse) {
    pdfParse = (await import('pdf-parse')).default;
  }
  return pdfParse;
}

// Schema for parsed PDF content
const parsedPdfContentSchema = z.object({
  fullText: z.string(),
  pageCount: z.number(),
  pages: z.array(z.object({
    pageNumber: z.number(),
    text: z.string(),
    agendaItems: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      pageNumber: z.number(),
      confidence: z.enum(['low', 'medium', 'high'])
    })),
    decisions: z.array(z.object({
      title: z.string(),
      description: z.string(),
      outcome: z.string().optional(),
      vote: z.string().optional(),
      pageNumber: z.number(),
      confidence: z.enum(['low', 'medium', 'high'])
    })),
    amounts: z.array(z.object({
      amount: z.number(),
      currency: z.string().default('GBP'),
      context: z.string(),
      pageNumber: z.number(),
      confidence: z.enum(['low', 'medium', 'high'])
    })),
    metadata: z.record(z.any()).optional()
  })),
  metadata: z.object({
    title: z.string().optional(),
    author: z.string().optional(),
    subject: z.string().optional(),
    creator: z.string().optional(),
    producer: z.string().optional(),
    creationDate: z.date().optional(),
    modificationDate: z.date().optional()
  }).optional(),
  extractionMethod: z.enum(['text_extraction', 'ocr', 'hybrid']),
  confidence: z.enum(['low', 'medium', 'high'])
});

export type ParsedPdfContent = z.infer<typeof parsedPdfContentSchema>;

/**
 * Enhanced PDF Parser Service
 * Extracts structured content including agenda items, decisions, and financial amounts
 */
export class PdfParserService {
  private tempDir: string;
  private ocrWorker: any;

  constructor(tempDir: string = '/tmp/pdf-parser') {
    this.tempDir = tempDir;
    this.ensureTempDir();
  }

  /**
   * Parse PDF file and extract structured content
   */
  async parsePdf(filePath: string, options: {
    extractAgendaItems?: boolean;
    extractDecisions?: boolean;
    extractAmounts?: boolean;
    useOcr?: boolean;
    ocrLanguage?: string;
  } = {}): Promise<ParsedPdfContent> {
    const {
      extractAgendaItems = true,
      extractDecisions = true,
      extractAmounts = true,
      useOcr = false,
      ocrLanguage = 'eng'
    } = options;

    try {
      // Read PDF buffer
      const buffer = await fs.promises.readFile(filePath);
      
      // Extract text using pdf-parse
      const pdfParseModule = await getPdfParse();
      const pdfData = await pdfParseModule(buffer, {
        pagerender: async (pageData: any) => {
          return pageData.getTextContent();
        }
      });

      const extractionMethod = useOcr ? 'hybrid' : 'text_extraction';
      let pages: ParsedPdfContent['pages'] = [];

      // Process each page
      for (let pageNum = 1; pageNum <= pdfData.numpages; pageNum++) {
        let pageText = await this.extractPageText(buffer, pageNum);
        
        // If text extraction fails or returns little text, try OCR
        if (useOcr && pageText.length < 100) {
          pageText = await this.extractTextViaOcr(buffer, pageNum, ocrLanguage);
        }

        const page = {
          pageNumber: pageNum,
          text: pageText,
          agendaItems: extractAgendaItems ? await this.extractAgendaItems(pageText, pageNum) : [],
          decisions: extractDecisions ? await this.extractDecisions(pageText, pageNum) : [],
          amounts: extractAmounts ? await this.extractAmounts(pageText, pageNum) : [],
          metadata: {}
        };

        pages.push(page);
      }

      // Calculate overall confidence
      const confidence = this.calculateOverallConfidence(pages);

      const result: ParsedPdfContent = {
        fullText: pdfData.text,
        pageCount: pdfData.numpages,
        pages,
        metadata: await this.extractMetadata(pdfData),
        extractionMethod,
        confidence
      };

      return parsedPdfContentSchema.parse(result);

    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from a specific page
   */
  private async extractPageText(buffer: Buffer, pageNum: number): Promise<string> {
    try {
      const pdfParseModule = await getPdfParse();
      const pdfData = await pdfParseModule(buffer, {
        first: pageNum,
        last: pageNum
      });
      return pdfData.text;
    } catch (error) {
      console.error(`Error extracting text from page ${pageNum}:`, error);
      return '';
    }
  }

  /**
   * Extract text using OCR (for scanned documents)
   */
  private async extractTextViaOcr(buffer: Buffer, pageNum: number, language: string): Promise<string> {
    try {
      // Convert PDF page to image
      const imageBuffer = await this.convertPageToImage(buffer, pageNum);
      
      // Initialize OCR worker if needed
      if (!this.ocrWorker) {
        this.ocrWorker = await createWorker(language);
      }

      // Extract text via OCR
      const { data: { text } } = await this.ocrWorker.recognize(imageBuffer);
      return text;

    } catch (error) {
      console.error(`OCR failed for page ${pageNum}:`, error);
      return '';
    }
  }

  /**
   * Convert PDF page to image for OCR
   */
  private async convertPageToImage(buffer: Buffer, pageNum: number): Promise<Buffer> {
    // Write buffer to temp file
    const tempPdfPath = path.join(this.tempDir, `temp-${Date.now()}.pdf`);
    await fs.promises.writeFile(tempPdfPath, buffer);

    try {
      // Convert to image
      const convert = pdf2pic.fromPath(tempPdfPath, {
        density: 300,
        saveFilename: `page-${pageNum}`,
        savePath: this.tempDir,
        format: 'png',
        width: 2000,
        height: 2000
      });

      const result = await convert(pageNum, { responseType: 'buffer' });
      
      // Clean up temp PDF
      await fs.promises.unlink(tempPdfPath);
      
      return result.buffer;

    } catch (error) {
      // Clean up temp PDF on error
      try {
        await fs.promises.unlink(tempPdfPath);
      } catch {}
      throw error;
    }
  }

  /**
   * Extract agenda items from page text
   */
  private async extractAgendaItems(text: string, pageNum: number): Promise<Array<{
    title: string;
    description?: string;
    pageNumber: number;
    confidence: 'low' | 'medium' | 'high';
  }>> {
    const agendaItems: Array<{
      title: string;
      description?: string;
      pageNumber: number;
      confidence: 'low' | 'medium' | 'high';
    }> = [];

    // Regex patterns for agenda items
    const agendaPatterns = [
      // Numbered items: "1. Item Title"
      /(?:^|\n)\s*(\d+\.?\s+)([^\n]+?)(?:\n|$)/gm,
      // Lettered items: "a) Item Title"
      /(?:^|\n)\s*([a-z]\)\s+)([^\n]+?)(?:\n|$)/gm,
      // Bulleted items: "• Item Title"
      /(?:^|\n)\s*([•\-\*]\s+)([^\n]+?)(?:\n|$)/gm,
      // Roman numerals: "i. Item Title"
      /(?:^|\n)\s*([ivxlc]+\.?\s+)([^\n]+?)(?:\n|$)/gim
    ];

    for (const pattern of agendaPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const title = match[2].trim();
        
        // Skip if too short or looks like header/footer
        if (title.length < 10 || this.isHeaderFooter(title)) {
          continue;
        }

        // Look for description in following lines
        const afterMatch = text.substring(match.index + match[0].length);
        const descriptionMatch = afterMatch.match(/^([^\n]+(?:\n[^\n]+){0,3})/);
        const description = descriptionMatch ? descriptionMatch[1].trim() : undefined;

        agendaItems.push({
          title,
          description: description && description.length > title.length ? description : undefined,
          pageNumber: pageNum,
          confidence: this.assessTextConfidence(title)
        });
      }
    }

    // Remove duplicates and sort by appearance
    return this.deduplicateItems(agendaItems);
  }

  /**
   * Extract decisions from page text
   */
  private async extractDecisions(text: string, pageNum: number): Promise<Array<{
    title: string;
    description: string;
    outcome?: string;
    vote?: string;
    pageNumber: number;
    confidence: 'low' | 'medium' | 'high';
  }>> {
    const decisions: Array<{
      title: string;
      description: string;
      outcome?: string;
      vote?: string;
      pageNumber: number;
      confidence: 'low' | 'medium' | 'high';
    }> = [];

    // Patterns for decisions
    const decisionPatterns = [
      // "RESOLVED that..."
      /RESOLVED\s+that\s+([^\.]+\.)/gim,
      // "DECISION: ..."
      /DECISION:?\s*([^\n]+)/gim,
      // "It was agreed that..."
      /It\s+was\s+agreed\s+that\s+([^\.]+\.)/gim,
      // "The Committee decided..."
      /The\s+Committee\s+decided\s+([^\.]+\.)/gim
    ];

    for (const pattern of decisionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const decisionText = match[1].trim();
        
        if (decisionText.length < 20) continue;

        // Look for vote information nearby
        const contextStart = Math.max(0, match.index - 200);
        const contextEnd = Math.min(text.length, match.index + match[0].length + 200);
        const context = text.substring(contextStart, contextEnd);
        
        const voteMatch = context.match(/(?:unanimous|voted|carried|defeated|(\d+)\s+in\s+favour|(\d+)\s+against)/i);
        const vote = voteMatch ? voteMatch[0] : undefined;

        // Extract outcome
        const outcomeMatch = context.match(/(?:approved|rejected|deferred|carried|defeated)/i);
        const outcome = outcomeMatch ? outcomeMatch[0] : undefined;

        decisions.push({
          title: `Decision: ${decisionText.substring(0, 100)}...`,
          description: decisionText,
          outcome,
          vote,
          pageNumber: pageNum,
          confidence: this.assessTextConfidence(decisionText)
        });
      }
    }

    return this.deduplicateItems(decisions);
  }

  /**
   * Extract financial amounts from page text
   */
  private async extractAmounts(text: string, pageNum: number): Promise<Array<{
    amount: number;
    currency: string;
    context: string;
    pageNumber: number;
    confidence: 'low' | 'medium' | 'high';
  }>> {
    const amounts: Array<{
      amount: number;
      currency: string;
      context: string;
      pageNumber: number;
      confidence: 'low' | 'medium' | 'high';
    }> = [];

    // Patterns for financial amounts
    const amountPatterns = [
      // £123,456.78
      /£([\d,]+\.?\d*)/g,
      // $123,456.78 (in case of other currencies)
      /\$([\d,]+\.?\d*)/g,
      // 123,456.78 (plain numbers that might be amounts)
      /\b([\d,]+\.?\d*)\s*(?:pounds?|GBP|pence|p\b)/gi
    ];

    for (const pattern of amountPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        
        // Skip if not a valid amount or too small to be significant
        if (isNaN(amount) || amount < 1) continue;

        // Get context around the amount
        const contextStart = Math.max(0, match.index - 50);
        const contextEnd = Math.min(text.length, match.index + match[0].length + 50);
        const context = text.substring(contextStart, contextEnd).trim();

        // Determine currency
        let currency = 'GBP';
        if (match[0].includes('$')) currency = 'USD';

        // Assess confidence based on context
        const confidence = this.assessAmountConfidence(context, amount);

        amounts.push({
          amount,
          currency,
          context,
          pageNumber: pageNum,
          confidence
        });
      }
    }

    // Sort by amount (descending) and remove duplicates
    return amounts
      .sort((a, b) => b.amount - a.amount)
      .filter((item, index, arr) => 
        // Remove duplicates within same page
        arr.findIndex(other => 
          Math.abs(other.amount - item.amount) < 0.01 && 
          other.pageNumber === item.pageNumber
        ) === index
      );
  }

  /**
   * Extract metadata from PDF
   */
  private async extractMetadata(pdfData: any): Promise<ParsedPdfContent['metadata']> {
    const info = pdfData.info || {};
    
    return {
      title: info.Title || undefined,
      author: info.Author || undefined,
      subject: info.Subject || undefined,
      creator: info.Creator || undefined,
      producer: info.Producer || undefined,
      creationDate: info.CreationDate ? new Date(info.CreationDate) : undefined,
      modificationDate: info.ModDate ? new Date(info.ModDate) : undefined
    };
  }

  /**
   * Calculate overall confidence for the extraction
   */
  private calculateOverallConfidence(pages: ParsedPdfContent['pages']): 'low' | 'medium' | 'high' {
    if (pages.length === 0) return 'low';

    const allItems = [
      ...pages.flatMap(p => p.agendaItems),
      ...pages.flatMap(p => p.decisions),
      ...pages.flatMap(p => p.amounts)
    ];

    if (allItems.length === 0) return 'low';

    const confidenceScores = allItems.map(item => {
      switch (item.confidence) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
      }
    });

    const average = confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
    
    if (average >= 2.5) return 'high';
    if (average >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Assess confidence of extracted text
   */
  private assessTextConfidence(text: string): 'low' | 'medium' | 'high' {
    // High confidence indicators
    if (text.match(/(?:RESOLVED|DECISION|agenda\s+item|committee|council)/i)) {
      return 'high';
    }

    // Medium confidence indicators
    if (text.length > 50 && text.match(/[A-Z][a-z]+/)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Assess confidence of extracted amounts
   */
  private assessAmountConfidence(context: string, amount: number): 'low' | 'medium' | 'high' {
    const contextLower = context.toLowerCase();

    // High confidence indicators
    if (contextLower.match(/(?:budget|cost|spend|payment|grant|fee|charge)/)) {
      return 'high';
    }

    // Medium confidence indicators
    if (amount >= 1000 && contextLower.match(/(?:total|sum|amount|value)/)) {
      return 'medium';
    }

    // Low confidence for small amounts or unclear context
    if (amount < 100 || !contextLower.match(/(?:£|\$|pound|dollar|cost|pay)/)) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Check if text is likely a header or footer
   */
  private isHeaderFooter(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // Common header/footer patterns
    const headerFooterPatterns = [
      /page\s+\d+/,
      /^\d+$/,
      /council|committee|meeting/,
      /^[a-z\s]+$/i, // All caps or all lowercase
      /^\s*$/
    ];

    return headerFooterPatterns.some(pattern => pattern.test(lowerText)) || text.length < 5;
  }

  /**
   * Remove duplicate items based on similarity
   */
  private deduplicateItems<T extends { title: string; pageNumber: number }>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = `${item.title.toLowerCase().replace(/\s+/g, ' ').trim()}-${item.pageNumber}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Ensure temp directory exists
   */
  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Clean up temp files
   */
  async cleanup(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.tempDir);
      for (const file of files) {
        await fs.promises.unlink(path.join(this.tempDir, file));
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }

    // Terminate OCR worker
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }

  /**
   * Parse council meeting agenda PDF
   */
  async parseAgendaPdf(filePath: string): Promise<{
    meetingTitle: string;
    meetingDate?: Date;
    committee: string;
    agendaItems: Array<{
      itemNumber: string;
      title: string;
      description?: string;
      presenter?: string;
      pageNumber: number;
      estimatedDuration?: string;
    }>;
    metadata: ParsedPdfContent['metadata'];
  }> {
    const parsed = await this.parsePdf(filePath, {
      extractAgendaItems: true,
      extractDecisions: false,
      extractAmounts: false
    });

    // Extract meeting-specific information from first page
    const firstPageText = parsed.pages[0]?.text || '';
    
    const meetingTitle = this.extractMeetingTitle(firstPageText);
    const meetingDate = this.extractMeetingDate(firstPageText);
    const committee = this.extractCommittee(firstPageText);

    // Process agenda items with additional meeting-specific parsing
    const agendaItems = parsed.pages.flatMap(page => 
      page.agendaItems.map(item => ({
        itemNumber: this.extractItemNumber(item.title),
        title: item.title,
        description: item.description,
        presenter: this.extractPresenter(page.text, item.title),
        pageNumber: item.pageNumber,
        estimatedDuration: this.extractDuration(page.text, item.title)
      }))
    );

    return {
      meetingTitle,
      meetingDate,
      committee,
      agendaItems,
      metadata: parsed.metadata
    };
  }

  /**
   * Parse council minutes PDF
   */
  async parseMinutesPdf(filePath: string): Promise<{
    meetingTitle: string;
    meetingDate?: Date;
    committee: string;
    attendees: string[];
    decisions: Array<{
      agendaItem: string;
      decision: string;
      vote?: string;
      pageNumber: number;
    }>;
    actions: Array<{
      action: string;
      assignedTo?: string;
      deadline?: Date;
      pageNumber: number;
    }>;
    metadata: ParsedPdfContent['metadata'];
  }> {
    const parsed = await this.parsePdf(filePath, {
      extractAgendaItems: false,
      extractDecisions: true,
      extractAmounts: true
    });

    const firstPageText = parsed.pages[0]?.text || '';
    
    return {
      meetingTitle: this.extractMeetingTitle(firstPageText),
      meetingDate: this.extractMeetingDate(firstPageText),
      committee: this.extractCommittee(firstPageText),
      attendees: this.extractAttendees(firstPageText),
      decisions: parsed.pages.flatMap(page => 
        page.decisions.map(decision => ({
          agendaItem: decision.title,
          decision: decision.description,
          vote: decision.vote,
          pageNumber: decision.pageNumber
        }))
      ),
      actions: this.extractActions(parsed.fullText),
      metadata: parsed.metadata
    };
  }

  // Helper methods for meeting-specific extraction
  private extractMeetingTitle(text: string): string {
    const titleMatch = text.match(/(?:meeting|committee|council)\s+([^\n]+)/i);
    return titleMatch ? titleMatch[1].trim() : 'Unknown Meeting';
  }

  private extractMeetingDate(text: string): Date | undefined {
    const datePatterns = [
      /(\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})/i,
      /(\w+\s+\d{1,2},?\s+\d{4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{4}-\d{2}-\d{2})/
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return undefined;
  }

  private extractCommittee(text: string): string {
    const committeeMatch = text.match(/(?:committee|council|board):\s*([^\n]+)/i);
    return committeeMatch ? committeeMatch[1].trim() : 'Unknown Committee';
  }

  private extractAttendees(text: string): string[] {
    const attendeesSection = text.match(/(?:present|attendees|members):\s*([^\n]+(?:\n[^\n]+)*)/i);
    if (!attendeesSection) return [];

    const attendeesText = attendeesSection[1];
    return attendeesText
      .split(/[,;\n]/)
      .map(name => name.trim())
      .filter(name => name.length > 2 && name.match(/[A-Z][a-z]+/))
      .slice(0, 20); // Limit to reasonable number
  }

  private extractItemNumber(title: string): string {
    const numberMatch = title.match(/^(\d+\.?\w*)/);
    return numberMatch ? numberMatch[1] : '';
  }

  private extractPresenter(pageText: string, itemTitle: string): string | undefined {
    // Look for presenter near the agenda item
    const itemIndex = pageText.indexOf(itemTitle);
    if (itemIndex === -1) return undefined;

    const surroundingText = pageText.substring(
      Math.max(0, itemIndex - 100),
      Math.min(pageText.length, itemIndex + itemTitle.length + 100)
    );

    const presenterMatch = surroundingText.match(/(?:presented\s+by|presenter?:?)\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
    return presenterMatch ? presenterMatch[1] : undefined;
  }

  private extractDuration(pageText: string, itemTitle: string): string | undefined {
    const itemIndex = pageText.indexOf(itemTitle);
    if (itemIndex === -1) return undefined;

    const surroundingText = pageText.substring(
      Math.max(0, itemIndex - 50),
      Math.min(pageText.length, itemIndex + itemTitle.length + 100)
    );

    const durationMatch = surroundingText.match(/(\d+\s*(?:min|minute|hour)s?)/i);
    return durationMatch ? durationMatch[1] : undefined;
  }

  private extractActions(text: string): Array<{
    action: string;
    assignedTo?: string;
    deadline?: Date;
    pageNumber: number;
  }> {
    const actions: Array<{
      action: string;
      assignedTo?: string;
      deadline?: Date;
      pageNumber: number;
    }> = [];

    // Action patterns
    const actionPatterns = [
      /ACTION:?\s*([^\n]+)/gim,
      /(?:officer|member)\s+to\s+([^\n]+)/gim,
      /follow\s+up:?\s*([^\n]+)/gim
    ];

    let pageNum = 1;
    const lines = text.split('\n');
    let currentLine = 0;

    for (const pattern of actionPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const action = match[1].trim();
        
        // Calculate approximate page number
        const textUpToMatch = text.substring(0, match.index);
        const linesUpToMatch = textUpToMatch.split('\n').length;
        const estimatedPage = Math.ceil(linesUpToMatch / 50); // Rough estimate

        actions.push({
          action,
          assignedTo: this.extractAssignee(action),
          deadline: this.extractDeadline(action),
          pageNumber: estimatedPage
        });
      }
    }

    return actions;
  }

  private extractAssignee(actionText: string): string | undefined {
    const assigneeMatch = actionText.match(/(?:by|assigned\s+to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    return assigneeMatch ? assigneeMatch[1] : undefined;
  }

  private extractDeadline(actionText: string): Date | undefined {
    const deadlineMatch = actionText.match(/(?:by|before|deadline)\s+(\w+\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (deadlineMatch) {
      const date = new Date(deadlineMatch[1]);
      return !isNaN(date.getTime()) ? date : undefined;
    }
    return undefined;
  }
}

export default PdfParserService;
