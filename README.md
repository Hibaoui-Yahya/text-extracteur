# Text Extracteur

**AI-Powered OCR Document Text Extraction**

Extract text from PDFs, images, and scanned documents using the official Mistral OCR API (`mistral-ocr-2512`).

![Text Extracteur](public/logo.png)

## ✨ Features

- **🤖 AI-Powered OCR** - Official Mistral OCR API (`mistral-ocr-2512`) extracts text with 94.9% accuracy
- **📄 Multi-Format Support** - Process PDFs, PNG, JPG, and WEBP files with ease
- **🌍 Multi-Language Support** - Extract text from documents in any language without configuration
- **⚡ Instant Results** - Get extracted text within seconds, ready to copy and use
- **🔒 Privacy First** - Your documents are processed securely. No data is ever stored
- **📋 Easy Copy** - One-click copy functionality for extracted text

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Mistral AI API Key

### Installation

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
   
   Create a `.env.local` file in the root directory:
   ```env
   MISTRAL_API_KEY=your_mistral_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **AI/OCR**: [Mistral OCR API](https://docs.mistral.ai/api/endpoint/ocr) (`mistral-ocr-2512`)
- **Icons**: [Lucide React](https://lucide.dev/), [Iconsax](https://iconsax-react.pages.dev/)

## 🤖 Mistral OCR API

This project uses the official **Mistral OCR API** for document text extraction:

- **Endpoint**: `https://api.mistral.ai/v1/ocr`
- **Model**: `mistral-ocr-2512` (May 2025 version)
- **Capabilities**:
  - High-accuracy text recognition
  - Document structure understanding
  - Table extraction with formatting
  - Mathematical equation support
  - Multi-language support (1000+ languages)
  - Up to 2,000 pages per minute processing
- **Output**: Structured Markdown with preserved formatting

## 📁 Project Structure

```
text-extracteur/
├── public/
│   ├── logo.png           # Application logo
│   └── Conqrai.png        # Favicon
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ocr/
│   │   │       └── route.ts    # OCR API endpoint
│   │   ├── extract/
│   │   │   └── page.tsx        # Extraction tool page
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   └── ui/
│   │       ├── animated-group.tsx
│   │       ├── button.tsx
│   │       ├── cta-with-marquee.tsx
│   │       ├── grid-feature-cards.tsx
│   │       ├── header.tsx
│   │       ├── hero-section.tsx
│   │       ├── how-it-works.tsx
│   │       ├── menu-toggle-icon.tsx
│   │       └── use-scroll.tsx
│   └── lib/
│       ├── mistral.ts          # Mistral AI integration
│       └── utils.ts            # Utility functions
├── .env.local                  # Environment variables (create this)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🔧 API Reference

### POST `/api/ocr`

Extract text from uploaded documents.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` - The document to process (PDF, PNG, JPG, WEBP)

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

## 📝 Supported File Types

| Format | Max Size | Notes |
|--------|----------|-------|
| PDF | 20MB | Text-based and scanned |
| PNG | 20MB | All resolutions |
| JPG/JPEG | 20MB | All resolutions |
| WEBP | 20MB | All resolutions |

## 🔒 Privacy & Security

- **No Data Storage**: Documents are processed in memory and immediately discarded
- **Secure Processing**: All file handling is done server-side
- **API Key Security**: Your Mistral API key is never exposed to the client

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your `MISTRAL_API_KEY` environment variable
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Railway
- Render
- AWS Amplify
- DigitalOcean App Platform

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Mistral AI](https://mistral.ai/) for the powerful OCR API (`mistral-ocr-2512`)
- [Vercel](https://vercel.com/) for the Next.js framework
- [shadcn](https://twitter.com/shadcn) for the beautiful UI components

---

Made with ❤️ by [ConqrAI](https://github.com/conqrai)
