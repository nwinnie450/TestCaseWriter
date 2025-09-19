# Test Case Manager

> **Comprehensive Test Case Management System with Figma integration, Jira support, and execution tracking**

A professional-grade test case management system that transforms how QA teams create, organize, execute, and track test cases. Built with enterprise features including Figma design integration, Jira ticket management, and real-time execution dashboards.

![Test Case Manager](https://via.placeholder.com/800x400/0066CC/FFFFFF?text=Test+Case+Manager)

## 🚀 Key Features

### 📥 **Import/Export Capabilities**
- **Multiple Formats**: CSV, Excel, JSON, TestRail, Jira, XML
- **Smart Mapping**: Customizable field mapping for any source format
- **Bulk Operations**: Import hundreds of test cases in seconds
- **Export Flexibility**: Generate reports in multiple formats

### 🗂️ **Test Set Management**
- **Organize by Sprint/Feature**: Group test cases into logical sets
- **Team Assignment**: Assign test sets to specific testers
- **Execution Tracking**: Monitor progress across test sets
- **Clone & Reuse**: Duplicate test sets for regression testing

### ✅ **Advanced Test Execution**
- **Status Tracking**: Pass, Fail, Blocked, Skip with detailed notes
- **Jira Integration**: Link failures to defect tickets automatically
- **Screenshot Support**: Attach evidence for failures
- **Bulk Execution**: Update multiple test results simultaneously

### 🎫 **Jira Integration**
- **Automatic Defect Creation**: Generate Jira tickets for test failures
- **Blocking Management**: Link test cases to blocking Jira issues
- **Status Synchronization**: Keep test results and Jira tickets in sync
- **Traceability**: Full traceability from requirements to defects

### 🎨 **Figma Design Integration**
- **Embed Code Support**: Import designs using Figma embed codes
- **Design-to-Test**: Generate test cases directly from Figma prototypes
- **Visual Context**: Link test cases to specific design components
- **Category Detection**: Auto-suggest test categories based on design type

### 📊 **Professional Reporting & Dashboard**
- **Real-time Statistics**: Pass rates, execution progress, team velocity
- **Executive Summaries**: Stakeholder-ready reports with charts
- **Trend Analysis**: Track quality metrics over time
- **Custom Filters**: Filter by priority, category, assignee, status

## 🔒 Security

**IMPORTANT**: Never commit API keys or sensitive information to version control. See [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) for detailed security best practices.

### Quick Security Setup
1. Create `.env.local` file (automatically ignored by Git)
2. Add your API keys as environment variables
3. Never commit `.env` files or configuration with secrets

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern web browser
- Optional: Database (PostgreSQL recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TestCaseWriter
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Tailwind CSS, Custom Design System
- **State Management**: Zustand
- **Data Tables**: TanStack Table (React Table v8)
- **Drag & Drop**: dnd-kit
- **Form Handling**: React Hook Form
- **File Upload**: react-dropzone

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard
│   ├── templates/         # Template management
│   ├── generate/          # AI generation workflow
│   ├── library/           # Test case library
│   ├── export/            # Export center
│   └── settings/          # Application settings
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   ├── dashboard/        # Dashboard-specific
│   ├── template/         # Template editor
│   ├── upload/           # File upload
│   ├── generate/         # AI generation
│   ├── library/          # Test case management
│   └── export/           # Export functionality
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
└── store/                # State management
```

## 📋 Usage Guide

### 1. Creating Templates
1. Navigate to **Templates** section
2. Click **New Template**
3. Use drag-and-drop to add fields
4. Configure field properties
5. Preview and publish template

### 2. Generating Test Cases
1. Go to **Generate** section
2. Upload requirement documents
3. Select a template
4. Configure AI generation settings
5. Review and export results

### 3. Managing Test Cases
1. Visit **Library** section
2. View all test cases in data grid
3. Use bulk operations for efficiency
4. Filter and search as needed
5. Export to preferred format

### 4. Setting Up Exports
1. Access **Export Center**
2. Create export profiles
3. Configure field mappings
4. Test integrations
5. Export test cases

## 🔧 Configuration

### Environment Variables
Key configuration options in `.env.local`:

```env
# AI Service
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4

# Integrations
TESTRAIL_BASE_URL=https://company.testrail.io
JIRA_BASE_URL=https://company.atlassian.net

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=pdf,docx,md,txt,jpg,png
```

### Customization
- **Themes**: Modify `tailwind.config.js` for branding
- **Templates**: Add custom field types in template system
- **Integrations**: Extend export profiles for new tools
- **AI Models**: Configure different AI providers

## 🔌 Integrations

### Supported Export Formats
- **Microsoft Excel** (.xlsx)
- **CSV** (.csv) 
- **TestRail** (via API)
- **Jira/Xray** (via REST API)
- **Confluence** (via REST API)
- **JSON** (.json)

### AI Providers
- OpenAI GPT-4/GPT-3.5
- Azure OpenAI Service
- Custom AI endpoints

## 🧪 Testing

### Run Tests
```bash
npm run test
# or
yarn test
```

### Test Coverage
```bash
npm run test:coverage
# or
yarn test:coverage
```

### E2E Testing
```bash
npm run test:e2e
# or
yarn test:e2e
```

## 📦 Deployment

### Build for Production
```bash
npm run build
# or
yarn build
```

### Deployment Options
- **Vercel**: Recommended for Next.js apps
- **AWS**: EC2, ECS, or Lambda
- **Docker**: Container deployment
- **Traditional hosting**: Static export option

### Docker Deployment
```bash
# Build image
docker build -t test-case-writer .

# Run container
docker run -p 3000:3000 test-case-writer
```

## 🔒 Security

### Authentication
- NextAuth.js integration
- JWT token management
- Session timeout configuration
- Two-factor authentication ready

### Data Protection
- Input validation and sanitization
- File upload security scanning
- API rate limiting
- CORS configuration

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes and test thoroughly
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

### Code Standards
- TypeScript for type safety
- ESLint + Prettier for formatting
- Conventional commits for changelog
- Component documentation required

## 📊 Performance

### Optimization Features
- **Virtual scrolling** for large datasets
- **Code splitting** for faster loading
- **Image optimization** with Next.js
- **Caching strategies** for API responses
- **Bundle analysis** tools included

### Performance Targets
- **First Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Large dataset handling**: 10,000+ items
- **File upload**: Up to 10MB per file

## 🐛 Troubleshooting

### Common Issues

**File Upload Fails**
- Check `UPLOAD_MAX_SIZE` setting
- Verify file type is in `UPLOAD_ALLOWED_TYPES`
- Ensure proper permissions

**AI Generation Not Working**
- Verify `OPENAI_API_KEY` is set
- Check API key permissions
- Monitor rate limits

**Export Integration Issues**
- Test API credentials
- Verify base URLs are correct
- Check network connectivity

## 📞 Support

### Getting Help
- **Documentation**: Check this README and code comments
- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Email**: Contact team at [support@example.com]

### Reporting Bugs
Please include:
1. Environment details (OS, browser, Node version)
2. Steps to reproduce
3. Expected vs actual behavior
4. Console errors or logs
5. Screenshots if applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **React Table** for powerful data grid functionality
- **OpenAI** for AI capabilities
- **Testing Tools Community** for inspiration and feedback

## 🗺️ Roadmap

### Version 2.0 (Planned)
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Machine learning insights
- [ ] Custom AI model training
- [ ] Advanced workflow automation

### Version 1.1 (Next Release)
- [ ] Improved accessibility (WCAG 2.1 AA)
- [ ] Dark mode theme
- [ ] Offline functionality
- [ ] Advanced search capabilities
- [ ] Bulk import from existing tools

---

**Built with ❤️ by the QA Engineering Team**

*Making test case management effortless for engineering teams worldwide.*