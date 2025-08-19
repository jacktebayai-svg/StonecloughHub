// Mock storage implementation for serverless deployment
export class MockStorage {
  // Mock data
  private mockCouncilData = [
    {
      id: '1',
      title: 'Planning Application: 23/00234/FULL',
      description: 'Single storey rear extension at 45 Church Road, Stoneclough',
      dataType: 'planning_application' as const,
      status: 'Approved',
      date: new Date('2024-01-15'),
      location: '45 Church Road, Stoneclough',
      amount: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Council Meeting: February 2024',
      description: 'Monthly parish council meeting',
      dataType: 'council_meeting' as const,
      status: 'Scheduled',
      date: new Date('2024-02-15'),
      location: 'Village Hall',
      amount: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  private mockBusinesses = [
    {
      id: '1',
      name: 'The Village Cafe',
      description: 'Cozy local cafe serving fresh coffee and homemade cakes',
      category: 'restaurant_cafe' as const,
      address: '23 High Street, Stoneclough BL4 7TY',
      phone: '01204 555123',
      email: 'info@villagecafe.co.uk',
      website: null,
      isVerified: true,
      isPromoted: false,
      createdBy: 'admin-123',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  private mockForumDiscussions = [
    {
      id: '1',
      title: 'New Traffic Lights on High Street - What Do You Think?',
      content: 'I noticed they\'re installing new traffic lights at the High Street junction. What are everyone\'s thoughts on this?',
      category: 'general' as const,
      authorId: 'user-123',
      authorName: 'Sarah M.',
      authorInitials: 'SM',
      likes: 5,
      views: 24,
      replyCount: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  private mockBlogArticles = [
    {
      id: '1',
      title: 'Understanding Local Planning Applications: A Resident\'s Guide',
      content: 'Planning applications can seem complex, but understanding the process helps residents engage with local development decisions...',
      excerpt: 'A comprehensive guide to understanding how planning applications work in Stoneclough.',
      category: 'Planning',
      readTime: 8,
      isFeatured: true,
      isPromoted: false,
      authorId: 'admin-123',
      authorName: 'Stoneclough Hub Team',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  private mockSurveys = [
    {
      id: '1',
      title: 'Traffic Management Survey',
      description: 'Help us understand residents\' concerns about traffic and parking in Stoneclough',
      status: 'active' as const,
      responseCount: 45,
      createdBy: 'admin-123',
      endsAt: new Date('2024-06-30'),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Council Data methods
  async getCouncilData(type?: string, limit: number = 50) {
    let data = this.mockCouncilData;
    if (type) {
      data = data.filter(item => item.dataType === type);
    }
    return data.slice(0, limit);
  }

  async getCouncilDataStats() {
    return {
      planningApplications: this.mockCouncilData.filter(d => d.dataType === 'planning_application').length,
      totalSpending: 850000,
      upcomingMeetings: this.mockCouncilData.filter(d => d.dataType === 'council_meeting').length
    };
  }

  async createCouncilData(data: any) {
    const newItem = {
      ...data,
      id: String(this.mockCouncilData.length + 1),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockCouncilData.push(newItem);
    return newItem;
  }

  // Business methods
  async getBusinesses(category?: string, limit: number = 20) {
    let businesses = this.mockBusinesses;
    if (category) {
      businesses = businesses.filter(b => b.category === category);
    }
    return businesses.slice(0, limit);
  }

  async getPromotedBusinesses(limit: number = 5) {
    return this.mockBusinesses.filter(b => b.isPromoted).slice(0, limit);
  }

  async getBusiness(id: string) {
    return this.mockBusinesses.find(b => b.id === id);
  }

  async searchBusinesses(query: string) {
    return this.mockBusinesses.filter(b => 
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getUserBusinesses(userId: string) {
    return this.mockBusinesses.filter(b => b.createdBy === userId);
  }

  async createBusiness(business: any) {
    const newBusiness = {
      ...business,
      id: String(this.mockBusinesses.length + 1),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockBusinesses.push(newBusiness);
    return newBusiness;
  }

  async updateBusiness(id: string, business: any) {
    const index = this.mockBusinesses.findIndex(b => b.id === id);
    if (index >= 0) {
      this.mockBusinesses[index] = {
        ...this.mockBusinesses[index],
        ...business,
        updatedAt: new Date()
      };
      return this.mockBusinesses[index];
    }
    throw new Error('Business not found');
  }

  async deleteBusiness(id: string) {
    const index = this.mockBusinesses.findIndex(b => b.id === id);
    if (index >= 0) {
      this.mockBusinesses.splice(index, 1);
    }
  }

  // Forum methods
  async getForumDiscussions(category?: string, limit: number = 20) {
    let discussions = this.mockForumDiscussions;
    if (category) {
      discussions = discussions.filter(d => d.category === category);
    }
    return discussions.slice(0, limit);
  }

  async getForumDiscussion(id: string) {
    return this.mockForumDiscussions.find(d => d.id === id);
  }

  async createForumDiscussion(discussion: any) {
    const newDiscussion = {
      ...discussion,
      id: String(this.mockForumDiscussions.length + 1),
      likes: 0,
      views: 0,
      replyCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockForumDiscussions.push(newDiscussion);
    return newDiscussion;
  }

  async updateForumDiscussion(id: string, discussion: any) {
    const index = this.mockForumDiscussions.findIndex(d => d.id === id);
    if (index >= 0) {
      this.mockForumDiscussions[index] = {
        ...this.mockForumDiscussions[index],
        ...discussion,
        updatedAt: new Date()
      };
      return this.mockForumDiscussions[index];
    }
    throw new Error('Discussion not found');
  }

  async deleteForumDiscussion(id: string) {
    const index = this.mockForumDiscussions.findIndex(d => d.id === id);
    if (index >= 0) {
      this.mockForumDiscussions.splice(index, 1);
    }
  }

  async incrementViews(id: string) {
    const discussion = this.mockForumDiscussions.find(d => d.id === id);
    if (discussion) {
      discussion.views++;
    }
  }

  async getForumReplies(discussionId: string) {
    // Mock replies - in a real app these would be stored separately
    return [];
  }

  async createForumReply(reply: any) {
    // Mock reply creation
    return {
      ...reply,
      id: String(Date.now()),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async deleteForumReply(id: string) {
    // Mock deletion
  }

  // Blog methods
  async getBlogArticles(limit: number = 20) {
    return this.mockBlogArticles.slice(0, limit);
  }

  async getPromotedBlogArticles(limit: number = 5) {
    return this.mockBlogArticles.filter(a => a.isPromoted).slice(0, limit);
  }

  async getFeaturedBlogArticle() {
    return this.mockBlogArticles.find(a => a.isFeatured);
  }

  async getBlogArticle(id: string) {
    return this.mockBlogArticles.find(a => a.id === id);
  }

  async createBlogArticle(article: any) {
    const newArticle = {
      ...article,
      id: String(this.mockBlogArticles.length + 1),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockBlogArticles.push(newArticle);
    return newArticle;
  }

  async updateBlogArticle(id: string, article: any) {
    const index = this.mockBlogArticles.findIndex(a => a.id === id);
    if (index >= 0) {
      this.mockBlogArticles[index] = {
        ...this.mockBlogArticles[index],
        ...article,
        updatedAt: new Date()
      };
      return this.mockBlogArticles[index];
    }
    throw new Error('Article not found');
  }

  async deleteBlogArticle(id: string) {
    const index = this.mockBlogArticles.findIndex(a => a.id === id);
    if (index >= 0) {
      this.mockBlogArticles.splice(index, 1);
    }
  }

  // Survey methods
  async getSurveys(status?: string) {
    let surveys = this.mockSurveys;
    if (status) {
      surveys = surveys.filter(s => s.status === status);
    }
    return surveys;
  }

  async getSurvey(id: string) {
    return this.mockSurveys.find(s => s.id === id);
  }

  async createSurvey(survey: any) {
    const newSurvey = {
      ...survey,
      id: String(this.mockSurveys.length + 1),
      responseCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockSurveys.push(newSurvey);
    return newSurvey;
  }

  async updateSurvey(id: string, survey: any) {
    const index = this.mockSurveys.findIndex(s => s.id === id);
    if (index >= 0) {
      this.mockSurveys[index] = {
        ...this.mockSurveys[index],
        ...survey,
        updatedAt: new Date()
      };
      return this.mockSurveys[index];
    }
    throw new Error('Survey not found');
  }

  async deleteSurvey(id: string) {
    const index = this.mockSurveys.findIndex(s => s.id === id);
    if (index >= 0) {
      this.mockSurveys.splice(index, 1);
    }
  }

  async createSurveyResponse(response: any) {
    // Mock response creation
    return {
      ...response,
      id: String(Date.now()),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getSurveyResults(surveyId: string) {
    // Mock survey results
    return {
      totalResponses: 45,
      responses: []
    };
  }

  // User/Profile methods (basic mock implementations)
  async getUser(id: string) {
    return null; // These would be handled by mock auth
  }

  async getUserByEmail(email: string) {
    return null; // These would be handled by mock auth
  }

  async createUser(user: any) {
    return user; // These would be handled by mock auth
  }

  async updateUser(id: string, user: any) {
    return user; // These would be handled by mock auth
  }

  async getUserProfile(userId: string) {
    return {
      id: `profile-${userId}`,
      userId,
      displayName: 'Mock User',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async createProfile(profile: any) {
    return {
      ...profile,
      id: `profile-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getProfile(userId: string) {
    return this.getUserProfile(userId);
  }

  async updateProfile(userId: string, profile: any) {
    return {
      ...profile,
      id: `profile-${userId}`,
      userId,
      updatedAt: new Date()
    };
  }

  // Global search
  async globalSearch(params: any) {
    const { query, type, limit = 20 } = params;
    const results: any[] = [];

    if (!type || type === 'businesses') {
      const businesses = await this.searchBusinesses(query);
      results.push(...businesses.map(b => ({ ...b, type: 'business' })));
    }

    if (!type || type === 'forum') {
      const discussions = this.mockForumDiscussions.filter(d =>
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.content.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...discussions.map(d => ({ ...d, type: 'discussion' })));
    }

    if (!type || type === 'blog') {
      const articles = this.mockBlogArticles.filter(a =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.content.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...articles.map(a => ({ ...a, type: 'article' })));
    }

    return results.slice(0, limit);
  }

  // Additional mock methods for completeness
  async getUserSkills(userId: string) { return []; }
  async createSkill(skill: any) { return skill; }
  async getSkillByName(name: string) { return null; }
  async addSkillToUser(userId: string, skillId: string, level?: string) { return {} as any; }
  async removeSkillFromUser(userId: string, skillId: string) { }
  async upsertUser(user: any) { return user; }
}

export const mockStorage = new MockStorage();
