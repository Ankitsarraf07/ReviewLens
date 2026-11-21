import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReviewLens — AI Review Insights",
  description: "AI-powered review analysis dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
