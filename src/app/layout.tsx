import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema EEG - HGP Palmas",
  description: "Sistema de Agendamento EEG Pediátrico - Hospital Geral de Palmas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50`}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
