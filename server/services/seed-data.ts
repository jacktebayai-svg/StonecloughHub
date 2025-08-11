import { storage } from '../storage';
import { 
  InsertCouncilData, 
  InsertBusiness, 
  InsertBlogArticle, 
  InsertForumDiscussion, 
  InsertSurvey 
} from '@shared/schema';

export async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Seeding database with sample data...');

    // Seed council data
    await seedCouncilData();
    
    // Seed businesses
    await seedBusinesses();
    
    // Seed blog articles
    await seedBlogArticles();
    
    // Seed forum discussions
    await seedForumDiscussions();
    
    // Seed surveys
    await seedSurveys();
    
    console.log('✅ Database seeding completed');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

async function seedCouncilData(): Promise<void> {
  const councilDataItems: InsertCouncilData[] = [
    {
      title: 'Planning Application: 23/00234/FULL',
      description: 'Single storey rear extension at 45 Church Road, Stoneclough',
      dataType: 'planning_application',
      sourceUrl: 'https://paplanning.bolton.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=23234FULL',
      status: 'Approved',
      date: new Date('2024-01-15'),
      location: '45 Church Road, Stoneclough',
      metadata: {
        reference: '23/00234/FULL',
        applicant: 'Mr. J. Smith',
        type: 'planning_application'
      }
    },
    {
      title: 'Planning Application: 23/00567/FULL',
      description: 'Two storey side extension at 12 High Street, Stoneclough',
      dataType: 'planning_application',
      sourceUrl: 'https://paplanning.bolton.gov.uk/online-applications/applicationDetails.do?activeTab=summary&keyVal=23567FULL',
      status: 'Pending',
      date: new Date('2024-02-20'),
      location: '12 High Street, Stoneclough',
      metadata: {
        reference: '23/00567/FULL',
        applicant: 'Mrs. A. Johnson',
        type: 'planning_application'
      }
    },
    {
      title: 'Council Spending: Highway Maintenance Contract',
      description: 'Annual highway maintenance and resurfacing contract',
      dataType: 'council_spending',
      sourceUrl: 'https://www.bolton.gov.uk/council/transparency',
      amount: 850000,
      date: new Date('2024-01-10'),
      metadata: {
        department: 'Highways',
        supplier: 'Bolton Road Services Ltd',
        type: 'contract'
      }
    },
    {
      title: 'Council Spending: Community Center Renovation',
      description: 'Renovation works for Stoneclough Community Center',
      dataType: 'council_spending',
      sourceUrl: 'https://www.bolton.gov.uk/council/transparency',
      amount: 125000,
      date: new Date('2024-02-05'),
      location: 'Stoneclough Community Center',
      metadata: {
        department: 'Community Services',
        supplier: 'Local Construction Co',
        type: 'capital_project'
      }
    },
    {
      title: 'Planning Committee Meeting - March 2024',
      description: 'Monthly planning committee meeting to discuss local applications',
      dataType: 'council_meeting',
      sourceUrl: 'https://www.bolton.gov.uk/council/meetings-agendas-and-minutes',
      date: new Date('2024-03-15'),
      metadata: {
        committee: 'Planning Committee',
        agenda: 'Available online',
        type: 'council_meeting'
      }
    }
  ];

  for (const item of councilDataItems) {
    await storage.createCouncilData(item);
  }
  
  console.log('✅ Seeded council data');
}

async function seedBusinesses(): Promise<void> {
  const businesses: InsertBusiness[] = [
    {
      name: 'The Village Cafe',
      description: 'Cozy local cafe serving fresh coffee, homemade cakes, and light lunches. Popular with residents and visitors alike.',
      category: 'restaurant_cafe',
      address: '23 High Street, Stoneclough BL4 7TY',
      phone: '01204 555123',
      email: 'info@villagecafe-stoneclough.co.uk',
      website: 'https://villagecafe-stoneclough.co.uk',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
      isVerified: true,
      isPremium: true
    },
    {
      name: 'Stoneclough Hardware',
      description: 'Family-run hardware store with everything you need for home improvements, gardening, and DIY projects.',
      category: 'home_garden',
      address: '15 Church Road, Stoneclough BL4 7RS',
      phone: '01204 555234',
      email: 'sales@stonecloughhardware.co.uk',
      isVerified: true,
      isPremium: false
    },
    {
      name: 'Beauty & Beyond',
      description: 'Professional beauty salon offering hair styling, nail treatments, and skincare services.',
      category: 'health_beauty',
      address: '8 Manchester Road, Stoneclough BL4 7QW',
      phone: '01204 555345',
      email: 'bookings@beautybeyond.co.uk',
      website: 'https://beautybeyond-stoneclough.co.uk',
      isVerified: true,
      isPremium: true
    },
    {
      name: 'Stoneclough Accounting Services',
      description: 'Professional accounting and tax services for individuals and small businesses in the local area.',
      category: 'professional_services',
      address: '45 Victoria Street, Stoneclough BL4 7UE',
      phone: '01204 555456',
      email: 'enquiries@stonecloughaccounting.co.uk',
      isVerified: false,
      isPremium: false
    },
    {
      name: 'The Corner Shop',
      description: 'Convenient local shop stocking groceries, newspapers, and everyday essentials.',
      category: 'retail_shopping',
      address: '1 The Precinct, Stoneclough BL4 7RT',
      phone: '01204 555567',
      isVerified: true,
      isPremium: false
    }
  ];

  for (const business of businesses) {
    await storage.createBusiness(business);
  }
  
  console.log('✅ Seeded businesses');
}

async function seedBlogArticles(): Promise<void> {
  const articles: InsertBlogArticle[] = [
    {
      title: 'Understanding Local Planning Applications: A Resident\'s Guide',
      content: 'Planning applications can seem complex, but understanding the process helps you stay informed about developments in your area...',
      excerpt: 'A comprehensive guide to understanding how planning applications work in Stoneclough and how residents can get involved.',
      category: 'Planning',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600',
      readTime: 8,
      isFeatured: true,
      authorName: 'Stoneclough Hub Team'
    },
    {
      title: 'Council Budget 2024: Where Your Money Goes',
      content: 'This year\'s council budget shows significant investment in local infrastructure and community services...',
      excerpt: 'Breaking down the 2024 council budget and what it means for Stoneclough residents.',
      category: 'Featured Analysis',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600',
      readTime: 6,
      isFeatured: false,
      authorName: 'Data Analysis Team'
    },
    {
      title: 'Supporting Local Businesses: Why It Matters',
      content: 'Local businesses are the backbone of our community, providing jobs, services, and character to Stoneclough...',
      excerpt: 'Exploring the importance of supporting local businesses and how they contribute to our community.',
      category: 'Business',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600',
      readTime: 5,
      isFeatured: false,
      authorName: 'Community Team'
    }
  ];

  for (const article of articles) {
    await storage.createBlogArticle(article);
  }
  
  console.log('✅ Seeded blog articles');
}

async function seedForumDiscussions(): Promise<void> {
  const discussions: InsertForumDiscussion[] = [
    {
      title: 'New Traffic Lights on High Street - What Do You Think?',
      content: 'I noticed they\'re installing new traffic lights at the High Street junction. Has anyone heard when they\'ll be operational? Hopefully it will help with the traffic during school hours.',
      category: 'general',
      authorName: 'Sarah M.',
      authorInitials: 'SM'
    },
    {
      title: 'Recommend a Local Plumber?',
      content: 'Looking for a reliable local plumber for some work at home. Has anyone used someone they\'d recommend in the Stoneclough area?',
      category: 'business_recommendations',
      authorName: 'Mike Johnson',
      authorInitials: 'MJ'
    },
    {
      title: 'Community Garden Project - Volunteers Needed',
      content: 'We\'re starting a community garden project behind the community center. Looking for volunteers to help with planning and maintenance. Great way to meet neighbors and grow fresh produce!',
      category: 'local_events',
      authorName: 'Emma Wilson',
      authorInitials: 'EW'
    }
  ];

  for (const discussion of discussions) {
    await storage.createForumDiscussion(discussion);
  }
  
  console.log('✅ Seeded forum discussions');
}

async function seedSurveys(): Promise<void> {
  const surveys: InsertSurvey[] = [
    {
      title: 'Traffic Management Survey',
      description: 'Help us understand residents\' concerns about traffic and parking in Stoneclough',
      status: 'active',
      questions: [
        {
          id: 'traffic_main_concern',
          text: 'What is your main concern about traffic in Stoneclough?',
          type: 'multiple_choice',
          options: ['Speed', 'Volume', 'Parking', 'Safety', 'Other']
        },
        {
          id: 'improvement_priority',
          text: 'Which improvement would you prioritize?',
          type: 'multiple_choice',
          options: ['More parking spaces', 'Speed bumps', 'Better lighting', 'Pedestrian crossings']
        }
      ],
      endsAt: new Date('2024-06-30')
    },
    {
      title: 'Community Facilities Survey',
      description: 'Tell us what community facilities and services matter most to you',
      status: 'active',
      questions: [
        {
          id: 'facility_usage',
          text: 'Which community facilities do you use most often?',
          type: 'multiple_choice',
          options: ['Community Center', 'Library', 'Parks', 'Sports Facilities', 'None']
        },
        {
          id: 'new_facilities',
          text: 'What new facilities would you like to see in Stoneclough?',
          type: 'text'
        }
      ],
      endsAt: new Date('2024-07-15')
    }
  ];

  for (const survey of surveys) {
    await storage.createSurvey(survey);
  }
  
  console.log('✅ Seeded surveys');
}