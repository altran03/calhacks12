import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareLink - Healthcare Coordination Platform",
  description: "Empowering hospitals, shelters, transport services, and social workers through AI coordination",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
