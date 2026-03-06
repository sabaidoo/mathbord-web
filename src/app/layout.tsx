import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mathbord — Right Tutor. Right Plan. Visible Progress.",
  description:
    "Mathbord connects Canadian students with vetted specialist math tutors. K-12 through university.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
