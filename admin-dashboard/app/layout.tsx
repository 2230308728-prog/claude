import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "bmad 管理后台 - 研学商城管理系统",
  description: "研学商城管理后台，提供产品、订单、用户管理功能",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
