import * as cheerio from 'cheerio';
import type { 
  Councillor, Department, Service, Meeting, Decision, Policy, Consultation 
} from '@shared/enhanced-schema';

/**
 * Organizational Intelligence Module
 * Extracts comprehensive information about Bolton Council's structure,
 * roles, responsibilities, and decision-making processes for resident understanding
 */

export class OrganizationIntelligence {

  /**
   * Extract councillor information and political structure
   */
  static extractCouncillors(html: string, sourceUrl: string): {
    councillors: Councillor[];
    politicalStructure: any;
    committees: string[];
  } {
    const $ = cheerio.load(html);
    const councillors: Councillor[] = [];
    const committees = new Set<string>();

    // Extract councillor profiles
    const councillorSelectors = [
      '.councillor-profile',
      '.member-profile',
      '[data-councillor]',
      '.councillor-card',
      '.member-details'
    ];

    councillorSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const councillor = this.parseCouncillorElement($(element), sourceUrl);
        if (councillor) {
          councillors.push(councillor);
          councillor.committees.forEach(c => committees.add(c));
        }
      });
    });

    // Extract councillors from tables
    $('table').each((_, table) => {
      const $table = $(table);
      const headers = $table.find('thead th, tr:first-child td').map((_, el) => $(el).text().trim().toLowerCase()).get();
      
      if (this.isCouncillorTable(headers)) {
        const tableCouncillors = this.parseCouncillorTable($table, sourceUrl);
        councillors.push(...tableCouncillors);
      }
    });

    // Extract political structure
    const politicalStructure = this.extractPoliticalStructure($, sourceUrl);

    return {
      councillors,
      politicalStructure,
      committees: Array.from(committees)
    };
  }

  /**
   * Extract department structure and services
   */
  static extractDepartments(html: string, sourceUrl: string): {
    departments: Department[];
    services: Service[];
    organizationChart: any;
  } {
    const $ = cheerio.load(html);
    const departments: Department[] = [];
    const services: Service[] = [];

    // Look for department information
    const departmentSelectors = [
      '.department',
      '.service-area',
      '.directorate',
      '[data-department]',
      '.org-unit'
    ];

    departmentSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const dept = this.parseDepartmentElement($(element), sourceUrl);
        if (dept.department) departments.push(dept.department);
        services.push(...dept.services);
      });
    });

    // Extract from text patterns
    const textDepartments = this.extractDepartmentsFromText($.text(), sourceUrl);
    departments.push(...textDepartments.departments);
    services.push(...textDepartments.services);

    // Build organization chart
    const organizationChart = this.buildOrganizationChart(departments);

    return {
      departments,
      services,
      organizationChart
    };
  }

  /**
   * Extract meeting structures and decision-making processes
   */
  static extractGovernanceStructure(html: string, sourceUrl: string): {
    meetings: Meeting[];
    decisionProcesses: any[];
    committees: string[];
    governanceRules: string[];
  } {
    const $ = cheerio.load(html);
    const meetings: Meeting[] = [];
    const committees = new Set<string>();
    const decisionProcesses: any[] = [];
    const governanceRules: string[] = [];

    // Extract meeting information
    $('table, .meeting-list, .agenda-item').each((_, element) => {
      const $el = $(element);
      
      if (this.isMeetingElement($el)) {
        const meeting = this.parseMeetingElement($el, sourceUrl);
        if (meeting) {
          meetings.push(meeting);
          committees.add(meeting.committee);
        }
      }
    });

    // Extract decision-making processes
    const processPatterns = [
      /decision[s]?\s+(?:are\s+)?made\s+by\s+([^.]+)/gi,
      /the\s+([^,]+)\s+(?:is\s+)?responsible\s+for\s+([^.]+)/gi,
      /([^,]+)\s+committee\s+(?:will\s+)?(?:consider|decide|approve)\s+([^.]+)/gi
    ];

    processPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec($.text())) !== null) {
        decisionProcesses.push({
          process: match[0],
          authority: match[1],
          scope: match[2] || 'General decisions',
          sourceUrl
        });
      }
    });

    // Extract governance rules
    const rulePatterns = [
      /constitution/gi,
      /standing orders/gi,
      /code of conduct/gi,
      /procedure rules/gi,
      /financial regulations/gi
    ];

    rulePatterns.forEach(pattern => {
      const matches = $.text().match(pattern);
      if (matches) {
        governanceRules.push(...matches);
      }
    });

    return {
      meetings,
      decisionProcesses,
      committees: Array.from(committees),
      governanceRules: Array.from(new Set(governanceRules))
    };
  }

  /**
   * Extract policy framework and strategic priorities
   */
  static extractPolicyFramework(html: string, sourceUrl: string): {
    policies: Policy[];
    strategies: any[];
    priorities: string[];
    consultations: Consultation[];
  } {
    const $ = cheerio.load(html);
    const policies: Policy[] = [];
    const strategies: any[] = [];
    const priorities: string[] = [];
    const consultations: Consultation[] = [];

    // Extract policies
    $('a[href*="policy"], a[href*="strategy"], .policy-item, .strategy-item').each((_, element) => {
      const $el = $(element);
      const policy = this.parsePolicyElement($el, sourceUrl);
      if (policy) {
        if (policy.title.toLowerCase().includes('strategy')) {
          strategies.push(policy);
        } else {
          policies.push(policy);
        }
      }
    });

    // Extract strategic priorities from text
    const priorityPatterns = [
      /(?:strategic\s+)?priorit(?:y|ies)[:\s]+([^.]+)/gi,
      /key\s+objectives?[:\s]+([^.]+)/gi,
      /main\s+goals?[:\s]+([^.]+)/gi,
      /focus\s+areas?[:\s]+([^.]+)/gi
    ];

    priorityPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec($.text())) !== null) {
        const priority = match[1].trim();
        if (priority.length > 10 && priority.length < 200) {
          priorities.push(priority);
        }
      }
    });

    // Extract consultations
    $('a[href*="consultation"], .consultation-item, [data-consultation]').each((_, element) => {
      const consultation = this.parseConsultationElement($(element), sourceUrl);
      if (consultation) consultations.push(consultation);
    });

    return {
      policies,
      strategies,
      priorities: Array.from(new Set(priorities)),
      consultations
    };
  }

  /**
   * Extract service delivery information
   */
  static extractServiceDelivery(html: string, sourceUrl: string): {
    services: Service[];
    serviceAreas: string[];
    contactPoints: any[];
    digitalServices: Service[];
  } {
    const $ = cheerio.load(html);
    const services: Service[] = [];
    const serviceAreas = new Set<string>();
    const contactPoints: any[] = [];
    const digitalServices: Service[] = [];

    // Extract service information
    const serviceSelectors = [
      '.service-item',
      '.service-card',
      '[data-service]',
      'a[href*="service"]',
      '.service-link'
    ];

    serviceSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const service = this.parseServiceElement($(element), sourceUrl);
        if (service) {
          services.push(service);
          serviceAreas.add(service.category);
          
          if (service.onlineAccess) {
            digitalServices.push(service);
          }
        }
      });
    });

    // Extract contact information
    $('a[href^="mailto:"], a[href^="tel:"], .contact-info, .contact-details').each((_, element) => {
      const contact = this.parseContactElement($(element), sourceUrl);
      if (contact) contactPoints.push(contact);
    });

    return {
      services,
      serviceAreas: Array.from(serviceAreas),
      contactPoints,
      digitalServices
    };
  }

  // Helper methods for parsing elements

  private static parseCouncillorElement($element: cheerio.Cheerio, sourceUrl: string): Councillor | null {
    try {
      const name = $element.find('h1, h2, h3, .name, .councillor-name').first().text().trim() ||
                   $element.text().match(/councillor\s+([^,\n]+)/i)?.[1]?.trim() || '';
      
      if (!name || name.length < 2) return null;

      const ward = $element.find('.ward, .constituency').text().trim() ||
                   $element.text().match(/ward[:\s]+([^,\n]+)/i)?.[1]?.trim() || '';
      
      const party = $element.find('.party, .political-party').text().trim() ||
                    $element.text().match(/\b(conservative|labour|liberal democrat|green|independent)\b/i)?.[0] || '';

      const email = $element.find('a[href^="mailto:"]').attr('href')?.replace('mailto:', '') ||
                    $element.text().match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1] || '';

      const committees = this.extractCommittees($element.text());
      
      return {
        name,
        ward: ward || 'Unknown Ward',
        party,
        email: email || undefined,
        committees,
        responsibilities: this.extractResponsibilities($element.text()),
        lastUpdated: new Date()
      };
    } catch (error) {
      return null;
    }
  }

  private static parseCouncillorTable($table: cheerio.Cheerio, sourceUrl: string): Councillor[] {
    const councillors: Councillor[] = [];
    const headers = $table.find('thead th, tr:first-child td').map((_, el) => $(el).text().trim().toLowerCase()).get();
    
    const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('councillor'));
    const wardIndex = headers.findIndex(h => h.includes('ward') || h.includes('area'));
    const partyIndex = headers.findIndex(h => h.includes('party') || h.includes('group'));
    
    $table.find('tbody tr, tr:not(:first-child)').each((_, row) => {
      const cells = $(row).find('td').map((_, cell) => $(cell).text().trim()).get();
      
      if (cells.length >= 2 && nameIndex >= 0) {
        const councillor: Councillor = {
          name: cells[nameIndex] || 'Unknown',
          ward: cells[wardIndex] || 'Unknown Ward',
          party: cells[partyIndex] || '',
          committees: [],
          responsibilities: [],
          lastUpdated: new Date()
        };
        
        councillors.push(councillor);
      }
    });

    return councillors;
  }

  private static parseDepartmentElement($element: cheerio.Cheerio, sourceUrl: string): {
    department: Department | null;
    services: Service[];
  } {
    const name = $element.find('h1, h2, h3, .dept-name, .department-name').first().text().trim() ||
                 $element.text().match(/department\s+of\s+([^,\n]+)/i)?.[1]?.trim() || '';

    if (!name || name.length < 3) {
      return { department: null, services: [] };
    }

    const description = $element.find('.description, .dept-description').text().trim() ||
                       $element.text().substring(0, 300);

    const services: Service[] = [];
    $element.find('ul li, .service-list li, a[href*="service"]').each((_, serviceEl) => {
      const serviceName = $(serviceEl).text().trim();
      if (serviceName.length > 3) {
        services.push({
          name: serviceName,
          description: serviceName,
          department: name,
          category: this.categorizeService(serviceName),
          lastUpdated: new Date()
        });
      }
    });

    const department: Department = {
      name,
      description,
      services: services.map(s => s.name),
      responsibilities: this.extractResponsibilities($element.text()),
      lastUpdated: new Date()
    };

    return { department, services };
  }

  private static parseMeetingElement($element: cheerio.Cheerio, sourceUrl: string): Meeting | null {
    const title = $element.find('h1, h2, h3, .meeting-title').first().text().trim() ||
                  $element.text().match(/(?:meeting|committee)[:\s]+([^,\n]+)/i)?.[1]?.trim() || '';

    if (!title || title.length < 5) return null;

    const committee = this.extractCommitteeFromTitle(title);
    const dateMatch = $element.text().match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
    const date = dateMatch ? new Date(dateMatch[1]) : new Date();

    return {
      title,
      committee,
      date,
      status: 'scheduled',
      attendees: [],
      decisions: [],
      lastUpdated: new Date()
    };
  }

  private static parsePolicyElement($element: cheerio.Cheerio, sourceUrl: string): Policy | null {
    const title = $element.text().trim() || $element.attr('title') || '';
    
    if (!title || title.length < 5) return null;

    const href = $element.attr('href') || sourceUrl;
    
    return {
      title,
      description: title,
      department: this.inferDepartmentFromUrl(href),
      status: 'approved',
      objectives: [],
      targetAudience: [],
      successMetrics: [],
      documentUrl: href,
      lastUpdated: new Date()
    };
  }

  private static parseConsultationElement($element: cheerio.Cheerio, sourceUrl: string): Consultation | null {
    const title = $element.text().trim();
    if (!title || title.length < 5) return null;

    return {
      title,
      description: title,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'active',
      method: ['online'],
      targetAudience: 'Residents',
      lastUpdated: new Date()
    };
  }

  private static parseServiceElement($element: cheerio.Cheerio, sourceUrl: string): Service | null {
    const name = $element.text().trim();
    if (!name || name.length < 3) return null;

    const href = $element.attr('href');
    const isOnline = href && (href.includes('online') || href.includes('digital') || href.includes('apply'));

    return {
      name,
      description: name,
      department: this.inferDepartmentFromUrl(href || sourceUrl),
      category: this.categorizeService(name),
      onlineAccess: Boolean(isOnline),
      lastUpdated: new Date()
    };
  }

  private static parseContactElement($element: cheerio.Cheerio, sourceUrl: string): any {
    const text = $element.text().trim();
    const href = $element.attr('href') || '';
    
    if (href.startsWith('mailto:')) {
      return {
        type: 'email',
        value: href.replace('mailto:', ''),
        department: this.inferDepartmentFromContext(text),
        sourceUrl
      };
    } else if (href.startsWith('tel:')) {
      return {
        type: 'phone',
        value: href.replace('tel:', ''),
        department: this.inferDepartmentFromContext(text),
        sourceUrl
      };
    } else if (text.includes('@')) {
      return {
        type: 'email',
        value: text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1],
        department: this.inferDepartmentFromContext(text),
        sourceUrl
      };
    }
    
    return null;
  }

  // Helper utility methods

  private static isCouncillorTable(headers: string[]): boolean {
    return headers.some(h => h.includes('councillor') || h.includes('member') || h.includes('name')) &&
           headers.some(h => h.includes('ward') || h.includes('area'));
  }

  private static isMeetingElement($element: cheerio.Cheerio): boolean {
    const text = $element.text().toLowerCase();
    return text.includes('meeting') || text.includes('committee') || text.includes('agenda');
  }

  private static extractCommittees(text: string): string[] {
    const committees = [];
    const patterns = [
      /(\w+\s+committee)/gi,
      /(cabinet|overview|scrutiny|audit|planning|licensing|standards)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        committees.push(match[1]);
      }
    });

    return Array.from(new Set(committees));
  }

  private static extractResponsibilities(text: string): string[] {
    const responsibilities = [];
    const patterns = [
      /responsible\s+for\s+([^.]+)/gi,
      /duties\s+include\s+([^.]+)/gi,
      /portfolio\s+includes?\s+([^.]+)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        responsibilities.push(match[1].trim());
      }
    });

    return responsibilities;
  }

  private static extractPoliticalStructure($: cheerio.CheerioAPI, sourceUrl: string): any {
    const structure = {
      totalCouncillors: 0,
      partyComposition: {},
      leadership: [],
      mayoralSystem: false
    };

    // Extract party composition
    const partyPattern = /(\d+)\s*(conservative|labour|liberal democrat|green|independent)/gi;
    let match;
    while ((match = partyPattern.exec($.text())) !== null) {
      structure.partyComposition[match[2]] = parseInt(match[1]);
      structure.totalCouncillors += parseInt(match[1]);
    }

    // Look for mayoral system
    if ($.text().toLowerCase().includes('mayor')) {
      structure.mayoralSystem = true;
    }

    return structure;
  }

  private static buildOrganizationChart(departments: Department[]): any {
    return {
      type: 'organizational_chart',
      levels: {
        'Chief Executive': departments.length > 0 ? ['Chief Executive Office'] : [],
        'Directorates': departments.map(d => d.name),
        'Services': departments.flatMap(d => d.services)
      },
      totalDepartments: departments.length,
      avgServicesPerDept: departments.length > 0 ? 
        Math.round(departments.reduce((sum, d) => sum + d.services.length, 0) / departments.length) : 0
    };
  }

  private static extractDepartmentsFromText(text: string, sourceUrl: string): {
    departments: Department[];
    services: Service[];
  } {
    const departments: Department[] = [];
    const services: Service[] = [];
    
    // Common department patterns
    const deptPatterns = [
      /department\s+of\s+([^,\n.]+)/gi,
      /(planning|housing|finance|education|social\s+services|environment|transport|health)\s+department/gi,
      /(children'?s\s+services|adult\s+services|public\s+health|highways|waste)/gi
    ];

    const foundDepts = new Set<string>();

    deptPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const deptName = match[1].trim();
        if (deptName.length > 3 && !foundDepts.has(deptName)) {
          foundDepts.add(deptName);
          
          departments.push({
            name: deptName,
            description: `${deptName} department`,
            services: [],
            responsibilities: [],
            lastUpdated: new Date()
          });
        }
      }
    });

    return { departments, services };
  }

  private static extractCommitteeFromTitle(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('cabinet')) return 'Cabinet';
    if (lowerTitle.includes('planning')) return 'Planning Committee';
    if (lowerTitle.includes('licensing')) return 'Licensing Committee';
    if (lowerTitle.includes('audit')) return 'Audit Committee';
    if (lowerTitle.includes('overview')) return 'Overview and Scrutiny';
    if (lowerTitle.includes('council')) return 'Full Council';
    
    return 'General Committee';
  }

  private static categorizeService(serviceName: string): string {
    const lower = serviceName.toLowerCase();
    
    if (lower.includes('planning') || lower.includes('building')) return 'Planning & Building';
    if (lower.includes('housing') || lower.includes('homelessness')) return 'Housing';
    if (lower.includes('education') || lower.includes('school')) return 'Education';
    if (lower.includes('social') || lower.includes('care')) return 'Social Care';
    if (lower.includes('tax') || lower.includes('council tax')) return 'Council Tax';
    if (lower.includes('waste') || lower.includes('recycling')) return 'Waste & Recycling';
    if (lower.includes('transport') || lower.includes('parking')) return 'Transport';
    if (lower.includes('environment') || lower.includes('green')) return 'Environment';
    if (lower.includes('health') || lower.includes('public health')) return 'Public Health';
    if (lower.includes('license') || lower.includes('permit')) return 'Licensing';
    
    return 'General Services';
  }

  private static inferDepartmentFromUrl(url: string): string {
    const lower = url.toLowerCase();
    
    if (lower.includes('planning')) return 'Planning';
    if (lower.includes('housing')) return 'Housing';
    if (lower.includes('education')) return 'Education';
    if (lower.includes('finance')) return 'Finance';
    if (lower.includes('social')) return 'Social Services';
    if (lower.includes('environment')) return 'Environment';
    if (lower.includes('transport')) return 'Transport';
    if (lower.includes('health')) return 'Public Health';
    
    return 'General';
  }

  private static inferDepartmentFromContext(text: string): string {
    return this.inferDepartmentFromUrl(text);
  }
}
