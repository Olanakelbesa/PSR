import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/app/providers";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "RPDMS",
    template: "%s | RPDMS",
  },
  description:
    "Research and Policy Documents Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Analytics />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers session={session}>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
