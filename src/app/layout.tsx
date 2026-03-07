import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Noto_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const noto = Noto_Sans({
  variable: "--font-noto",
  subsets: ["latin", "latin-ext", "cyrillic", "greek", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Text Extracteur | AI-Powered OCR",
  description:
    "Upload your documents (PDF or image) and extract text using AI-powered OCR. Fast, accurate, and secure text extraction.",
  keywords: ["OCR", "text extraction", "AI", "PDF to text", "image to text"],
  authors: [{ name: "Text Extracteur" }],
  robots: "index, follow",
  icons: {
    icon: "/Conqrai.png",
    apple: "/Conqrai.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/Conqrai.png" type="image/png" />
        <link rel="apple-touch-icon" href="/Conqrai.png" />
      </head>
      <body
        className={`${jakarta.variable} ${noto.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
