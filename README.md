# StonecloughHub 🏘️

A comprehensive community platform for Stoneclough, featuring business directories, community forums, local council data integration, and resident engagement tools.

## 🌟 Features

- **🏢 Business Directory**: Local business listings with categories, search, and promotion features
- **💬 Community Forums**: Discussion boards for community engagement and local topics
- **📰 Blog Platform**: Community news, updates, and local content management
- **📊 Council Data Integration**: Planning applications, council meetings, and public spending data
- **📋 Surveys & Polls**: Community feedback and engagement tools
- **👤 User Profiles**: Personal profiles with skills and business management
- **🔍 Global Search**: Comprehensive search across all platform content
- **📱 Responsive Design**: Mobile-first design with bottom navigation
- **🔐 Secure Authentication**: Supabase Auth with role-based access control

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Query** for data fetching and caching
- **React Hook Form** with Zod validation
- **Wouter** for lightweight routing
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **PostgreSQL** database (Supabase)
- **Supabase Auth** for authentication
- **Zod** for runtime validation

### Infrastructure
- **Supabase** for database and authentication
- **Vercel** for deployment
- **GitHub Actions** for CI/CD (planned)

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- Supabase account for authentication
- Google Cloud Console account (for OAuth, optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/stoneclough-community-initiative/StonecloughHub.git
   cd StonecloughHub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables (see [Environment Variables](#environment-variables) section)

4. **Set up the database**
   ```bash
   # Run database migrations
   npm run db:migrate
   
   # Seed the database with initial data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Database (Supabase)
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Supabase Authentication
```bash
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_KEY=[YOUR-SERVICE-ROLE-KEY]

# Client-side (Vite)
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

### Authentication (Optional)
```bash
GOOGLE_CLIENT_ID=[YOUR-GOOGLE-CLIENT-ID]
GOOGLE_CLIENT_SECRET=[YOUR-GOOGLE-CLIENT-SECRET]
SESSION_SECRET=[RANDOM-SECRET-STRING]
```

### Application
```bash
APP_URL=http://localhost:5000
NODE_ENV=development
PORT=5000
```

## 🗄️ Database Setup

The application uses Supabase as the PostgreSQL database provider. Follow these steps:

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Configure your database URL** in the environment variables
3. **Run migrations** to set up the schema:
   ```bash
   npm run db:migrate
   ```
4. **Seed the database** with initial data:
   ```bash
   npm run db:seed
   ```

For detailed Supabase setup instructions, see [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md).

## 🔐 Authentication Setup

The application uses Supabase Auth for user authentication. To set up authentication:

1. **Follow the Supabase Auth setup guide**: [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md)
2. **Configure OAuth providers** (optional) in your Supabase dashboard
3. **Set up email templates** for password reset and verification
4. **Enable Row Level Security** for enhanced data protection

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push database schema changes
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run vercel-build` - Build for Vercel deployment

## 🚀 Deployment

The application is configured for deployment on Vercel with Supabase. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. **Connect your GitHub repository to Vercel**
2. **Configure environment variables** in Vercel dashboard
3. **Deploy automatically** on git push

## 🏗️ Project Structure

```
StonecloughHub/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── contexts/      # React contexts
│   ├── public/            # Static assets
│   └── lib/               # Utility libraries
├── server/                # Backend Express application
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic services
│   └── db/               # Database configuration
├── shared/               # Shared TypeScript types and schemas
├── scripts/              # Database and deployment scripts
└── docs/                 # Documentation
```

## 🤝 Contributing

We welcome contributions from the community! Please read our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 🧪 Testing

```bash
# Run type checking
npm run check

# Run linting (if configured)
npm run lint

# Run tests (when test suite is added)
npm test
```

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [Supabase Auth Setup](./SUPABASE_AUTH_SETUP.md) - Authentication configuration
- [API Documentation](./docs/api.md) - Backend API reference (planned)
- [Component Library](./docs/components.md) - Frontend component guide (planned)

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify your `DATABASE_URL` is correct
   - Ensure your Supabase project is active
   - Check firewall settings

2. **Authentication Problems**
   - Verify Supabase environment variables
   - Check OAuth provider configuration
   - Ensure redirect URLs are correct

3. **Build Errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility
   - Verify all environment variables are set

### Getting Help

- Check the [Issues](https://github.com/stoneclough-community-initiative/StonecloughHub/issues) page
- Review the documentation in the `docs/` folder
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Stoneclough Community** for inspiration and feedback
- **Bolton Council** for open data access
- **Open source contributors** for the amazing tools and libraries used in this project

## 📞 Contact

- **GitHub**: [Stoneclough Community Initiative](https://github.com/stoneclough-community-initiative)
- **Email**: [Contact Information]
- **Community Forum**: [StonecloughHub Platform]

---

**Built with ❤️ for the Stoneclough Community**
