import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HR Management System",
  description: "HR Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var attrs=['data-new-gr-c-s-check-loaded','data-gr-ext-installed','data-gramm','data-gramm_id'];attrs.forEach(function(a){try{document.documentElement.removeAttribute(a)}catch(e){};try{if(document.body)document.body.removeAttribute(a)}catch(e){};var els=document.querySelectorAll('['+a+']');for(var i=0;i<els.length;i++){els[i].removeAttribute(a)}})}catch(e){} })()`
          }}
        />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
