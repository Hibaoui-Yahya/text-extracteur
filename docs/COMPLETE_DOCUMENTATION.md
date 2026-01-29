# Text Extracteur - Complete Documentation

## 📋 Project Overview

**Text Extracteur** is an AI-powered OCR (Optical Character Recognition) web application that extracts text from PDFs, images, and scanned documents using the official Mistral OCR API (`mistral-ocr-2512`). The application provides a user-friendly interface for uploading documents and instantly receiving structured, formatted text.

### Key Features

- **🤖 AI-Powered OCR**: Uses Mistral's official OCR API with 94.9% accuracy
- **📄 Multi-Format Support**: Processes PDFs, PNG, JPG, and WEBP files
- **🌍 Multi-Language Support**: Extracts text from documents in any language
- **⚡ Instant Results**: Get extracted text within seconds
- **🔒 Privacy First**: No data storage - documents are processed and discarded
- **📋 Easy Copy**: One-click copy functionality for extracted text
- **🖼️ Paste Support**: Ctrl+V to paste images directly

## 🚀 Technical Architecture

### Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **AI/OCR**: Mistral OCR API (`mistral-ocr-2512`)
- **Icons**: Lucide React, Iconsax

### Project Structure

```
text-extracteur/
├── public/                  # Static assets
│   ├── Conqrai.png          # Favicon
│   ├── Conqrai_logo.svg     # Logo
│   └── [other assets]      # Icons and images
├── src/
│   ├── app/                # Next.js application routes
│   │   ├── api/             # API endpoints
│   │   │   └── ocr/         # OCR processing endpoint
│   │   ├── extract/         # Text extraction page
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page
│   ├── components/         # UI components
│   │   └── ui/              # Reusable UI components
│   └── lib/                # Core functionality
│       ├── mistral.ts       # Mistral AI integration
│       ├── pdf-converter.ts # PDF text extraction
│       └── utils.ts         # Utility functions
├── .env.local              # Environment variables
├── package.json            # Dependencies
└── [config files]          # Next.js, Tailwind, TypeScript config
```

## 🔧 Core Components

### 1. Landing Page (`src/app/page.tsx`)

The main landing page that showcases the application's features and provides navigation to the extraction tool.

**Key Components:**
- `HeroSection`: Main hero section with animated elements
- `FeatureCard`: Individual feature cards
- `HowItWorks`: Step-by-step guide
- `CTAWithMarquee`: Call-to-action with animated marquee

### 2. Extraction Tool (`src/app/extract/page.tsx`)

The main OCR processing interface where users upload documents and get text extraction results.

**Features:**
- Drag and drop file upload
- File validation (type and size)
- Ctrl+V paste image support
- Real-time file preview
- Progress indicators
- Error handling
- Markdown rendering of extracted text
- Copy to clipboard functionality

**Supported File Types:**
- PDF (up to 50MB)
- PNG, JPG, JPEG, WEBP (up to 50MB)

### 3. OCR API Endpoint (`src/app/api/ocr/route.ts`)

Server-side API endpoint that handles file processing and Mistral OCR integration.

**Functionality:**
- File validation and size checking
- File type detection
- Base64 encoding
- Mistral OCR API integration
- Error handling and response formatting

### 4. Mistral AI Integration (`src/lib/mistral.ts`)

Core library for interacting with Mistral's OCR API.

**Key Functions:**
- `extractTextFromImage()`: Extract text from single images
- `extractTextFromPdfWithOCR()`: Extract text from PDFs using OCR
- `structureText()`: Format raw text using Mistral AI
- `extractTextFromMultipleImages()`: Process multi-page documents

**API Details:**
- **Endpoint**: `https://api.mistral.ai/v1/ocr`
- **Model**: `mistral-ocr-2512` (May 2025 version)
- **Output**: Structured Markdown with preserved formatting

### 5. PDF Processing (`src/lib/pdf-converter.ts`)

Utility for extracting text from PDFs using unpdf (Mozilla's pdf.js for Node).

**Features:**
- Text extraction from PDFs
- Scanned document detection
- Page count analysis
- Text density calculation

## 🎨 UI Components

### Reusable Components

1. **`ExtractHeader`**: Navigation header for the extraction page
2. **`FeatureCard`**: Feature display cards with icons
3. **`HowItWorks`**: Step-by-step process explanation
4. **`CTAWithMarquee`**: Animated call-to-action section
5. **`Header`**: Main navigation header
6. **`AnimatedContainer`**: Animated wrapper for smooth transitions

### Design System

- **Color Scheme**: Dark theme with blue accents (#35AEF3)
- **Typography**: Modern, clean fonts
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first design with responsive breakpoints

## 🔄 Workflow

### User Flow

1. **Landing Page**: User arrives at the hero section
2. **Feature Exploration**: User learns about capabilities
3. **Navigation**: User clicks "Start Extracting" button
4. **File Upload**: User uploads or pastes a document
5. **Processing**: Application sends file to Mistral OCR API
6. **Results**: Extracted text is displayed with formatting
7. **Copy**: User copies text to clipboard

### Technical Flow

```
User Upload → File Validation → Base64 Encoding → Mistral OCR API → 
Text Extraction → Markdown Formatting → Result Display → Copy to Clipboard
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Mistral AI API Key

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/text-extracteur.git
   cd text-extracteur
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` file:
   ```env
   MISTRAL_API_KEY=your_mistral_api_key_here
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   
   Navigate to `http://localhost:3000`

## 📊 API Reference

### POST `/api/ocr`

Extract text from uploaded documents.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` - Document to process (PDF, PNG, JPG, WEBP)

**Response:**
```json
{
  "success": true,
  "text": "Extracted text content...",
  "pageCount": 1
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## 🔒 Security & Privacy

- **No Data Storage**: Documents are processed in memory and immediately discarded
- **Secure Processing**: All file handling is done server-side
- **API Key Security**: Mistral API key is never exposed to the client
- **HTTPS**: All communications are encrypted

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add `MISTRAL_API_KEY` environment variable
4. Deploy!

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Railway
- Render
- AWS Amplify
- DigitalOcean App Platform

## 📝 File Processing Details

### Supported File Types

| Format | Max Size | Notes |
|--------|----------|-------|
| PDF | 50MB | Text-based and scanned |
| PNG | 50MB | All resolutions |
| JPG/JPEG | 50MB | All resolutions |
| WEBP | 50MB | All resolutions |

### Processing Logic

1. **File Validation**: Check type and size limits
2. **Base64 Conversion**: Convert file to base64 for API transmission
3. **API Selection**: Route to appropriate Mistral API endpoint
4. **Text Extraction**: Process document with OCR
5. **Markdown Formatting**: Clean and structure extracted text
6. **Result Delivery**: Return formatted text to client

## 🎯 Performance Optimization

- **Lazy Loading**: Components load as needed
- **Caching**: API responses are cached where appropriate
- **Compression**: Files are compressed before processing
- **Error Handling**: Graceful degradation for API failures
- **Progress Indicators**: Visual feedback during processing

## 🤝 Contributing

Contributions are welcome! Follow these steps:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add some AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Mistral AI for the powerful OCR API (`mistral-ocr-2512`)
- Vercel for the Next.js framework
- shadcn for beautiful UI components
- Framer Motion for smooth animations

## 🔧 Troubleshooting

### Common Issues

**API Key Not Configured**
- Ensure `MISTRAL_API_KEY` is set in `.env.local`
- Restart development server after adding key

**File Upload Failures**
- Check file size limits (50MB max)
- Verify supported file types
- Check browser console for errors

**OCR Processing Errors**
- Verify Mistral API is operational
- Check API key validity
- Review error messages for specific issues

## 📈 Future Enhancements

- **Batch Processing**: Multiple file upload and processing
- **Language Detection**: Automatic language identification
- **Export Formats**: Download as PDF, DOCX, TXT
- **Advanced Editing**: Text correction and formatting tools
- **Mobile App**: Native mobile applications
- **API Integration**: REST API for programmatic access

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Mistral OCR API Docs](https://docs.mistral.ai/api/endpoint/ocr)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)

## 📊 Analytics & Monitoring

The application includes basic error tracking and logging. For production deployments, consider adding:

- Error monitoring (Sentry, LogRocket)
- Performance monitoring (New Relic, Datadog)
- Usage analytics (Google Analytics, Mixpanel)

## 🔐 Security Best Practices

1. **API Key Management**: Rotate keys regularly
2. **Rate Limiting**: Implement on API endpoints
3. **Input Validation**: Sanitize all user inputs
4. **CORS**: Configure properly for production
5. **HTTPS**: Enforce in production environments

## 🌐 Internationalization

The application supports multi-language text extraction but currently has English UI. Future versions could include:

- UI localization
- Language-specific formatting
- Right-to-left language support

## 📱 Mobile Responsiveness

The application is fully responsive with:
- Mobile-first design approach
- Touch-friendly interface elements
- Adaptive layouts for all screen sizes
- Optimized file upload for mobile devices

## 🎨 Design Principles

- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized for fast loading
- **Consistency**: Unified design language
- **User Experience**: Intuitive and simple workflow
- **Visual Hierarchy**: Clear information architecture

## 🔧 Configuration Options

### Environment Variables

- `MISTRAL_API_KEY`: Required for OCR functionality
- `NEXT_PUBLIC_APP_NAME`: Custom application name
- `NEXT_PUBLIC_MAX_FILE_SIZE`: Adjust file size limits
- `NEXT_PUBLIC_SUPPORTED_TYPES`: Customize supported file types

### Build Configuration

- **Next.js**: Configured in `next.config.ts`
- **Tailwind**: Configured in `tailwind.config.ts`
- **TypeScript**: Configured in `tsconfig.json`

## 📦 Dependencies

### Core Dependencies

- **Next.js 16**: React framework
- **React 19**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Utility-first CSS
- **Framer Motion**: Animations
- **unpdf**: PDF text extraction
- **sharp**: Image processing
- **pdf-lib**: PDF manipulation

### Development Dependencies

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Tailwind CSS**: PostCSS plugin

## 📝 Changelog

### Recent Updates

- Added Ctrl+V paste image functionality
- Improved navbar with back-to-home button
- Updated logo and branding
- Enhanced error handling
- Optimized file processing

## 🤔 FAQ

**Q: What file types are supported?**
A: PDF, PNG, JPG, JPEG, and WEBP files up to 50MB.

**Q: Is my data stored?**
A: No, documents are processed in memory and immediately discarded.

**Q: How accurate is the OCR?**
A: The Mistral OCR API has 94.9% accuracy for most documents.

**Q: Can I process multiple files at once?**
A: Currently one file at a time, but batch processing is planned.

**Q: What languages are supported?**
A: All languages - the OCR preserves original text exactly.

## 📞 Support

For issues or questions:
- Check the GitHub issues page
- Review the documentation
- Contact the maintainers via GitHub

## 🎯 Project Goals

1. **Accuracy**: Provide highly accurate text extraction
2. **Speed**: Deliver results quickly
3. **Privacy**: Protect user data
4. **Accessibility**: Make OCR available to everyone
5. **Simplicity**: Easy-to-use interface

## 🏆 Success Metrics

- **User Satisfaction**: Positive feedback and ratings
- **Processing Speed**: Average extraction time under 5 seconds
- **Accuracy**: Maintain 90%+ accuracy rate
- **Adoption**: Growing user base and engagement

## 📈 Roadmap

### Short-term (1-3 months)
- Add batch processing
- Implement export options
- Enhance mobile experience

### Medium-term (3-6 months)
- Add user accounts
- Implement document history
- Add collaboration features

### Long-term (6-12 months)
- Mobile applications
- Desktop application
- API marketplace integration

## 🔒 Compliance

- **GDPR**: Data privacy compliant
- **CCPA**: California privacy compliant
- **Accessibility**: WCAG 2.1 AA standards

## 📊 Performance Metrics

- **Load Time**: Under 2 seconds for main page
- **API Response**: Under 5 seconds for OCR processing
- **Error Rate**: Less than 1% of requests
- **Uptime**: 99.9% availability target

## 🎓 Development Best Practices

- **Code Quality**: Follow ESLint rules
- **Testing**: Comprehensive test coverage
- **Documentation**: Keep docs updated
- **Version Control**: Git workflow with feature branches
- **Code Reviews**: Required for all changes

## 📝 Release Process

1. **Development**: Feature implementation
2. **Testing**: Quality assurance
3. **Staging**: Pre-production testing
4. **Production**: Live deployment
5. **Monitoring**: Post-deployment verification

## 🌟 Key Differentiators

- **Official Mistral Integration**: Uses official OCR API
- **Privacy Focus**: No data storage policy
- **Multi-language**: Supports all languages natively
- **Modern UI**: Beautiful, intuitive interface
- **Performance**: Optimized for speed

## 📚 Additional Resources

- [Mistral OCR API Documentation](https://docs.mistral.ai/api/endpoint/ocr)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## 📝 Conclusion

Text Extracteur provides a powerful, privacy-focused solution for extracting text from documents using state-of-the-art AI technology. With its intuitive interface, multi-language support, and instant results, it offers an excellent user experience for anyone needing to convert documents to editable text.

The application is built on modern web technologies and follows best practices for security, performance, and accessibility. Whether you're processing invoices, contracts, books, or any other documents, Text Extracteur delivers accurate results quickly and securely.

---