import 'dotenv/config';
import { storage } from '../server/storage';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    console.log('Starting database seed...');

    // Create some categories
    console.log('Creating categories...');
    const healthcareCategory = await storage.createBusinessCategory({
      name: 'Healthcare',
      description: 'Medical services and healthcare providers'
    });

    const retailCategory = await storage.createBusinessCategory({
      name: 'Retail',
      description: 'Shops and retail establishments'
    });

    const foodCategory = await storage.createBusinessCategory({
      name: 'Food & Dining',
      description: 'Restaurants, cafes, and food services'
    });

    const servicesCategory = await storage.createBusinessCategory({
      name: 'Professional Services',
      description: 'Legal, financial, and professional services'
    });

    console.log('Categories created successfully');

    // Create some skills
    console.log('Creating skills...');
    const skills = [
      'Web Development',
      'Graphic Design',
      'Digital Marketing',
      'Project Management',
      'Customer Service',
      'Data Analysis',
      'Content Writing',
      'Social Media Management'
    ];

    for (const skillName of skills) {
      await storage.createSkill({ name: skillName });
    }

    console.log('Skills created successfully');

    // Create sample forum categories
    console.log('Creating forum categories...');
    const forumCategories = [
      {
        name: 'General Discussion',
        description: 'General community discussions and announcements'
      },
      {
        name: 'Local Events',
        description: 'Information about local events and activities'
      },
      {
        name: 'Business Network',
        description: 'Networking and business-related discussions'
      },
      {
        name: 'Community Support',
        description: 'Help and support for community members'
      }
    ];

    for (const category of forumCategories) {
      await storage.createForumCategory(category);
    }

    console.log('Forum categories created successfully');

    // Create blog categories
    console.log('Creating blog categories...');
    const blogCategories = [
      'Community News',
      'Local Business',
      'Events',
      'Health & Wellness',
      'Education',
      'Technology',
      'Environment',
      'Culture & Arts'
    ];

    for (const categoryName of blogCategories) {
      await storage.createBlogCategory({
        name: categoryName
      });
    }

    console.log('Blog categories created successfully');

    // Create admin user if it doesn't exist
    console.log('Creating admin user...');
    const adminExists = await storage.getUserByEmail('admin@stonecloughhub.com');
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const adminUser = await storage.createUser({
        email: 'admin@stonecloughhub.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'admin'
      });

      await storage.createProfile({
        userId: adminUser.id,
        displayName: 'Admin',
        bio: 'System administrator for StonecloughHub',
        location: 'Stoneclough, UK'
      });

      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    console.log('Database seed completed successfully!');
    
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed process failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
