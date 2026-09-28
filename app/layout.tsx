import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { getSessionUser } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "할일 + 계획 관리 앱",
  description: "할 일, 주간 계획, 1년 목표를 관리하는 앱",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const request = new NextRequest("http://localhost/", {
    headers: { cookie: cookieStore.toString() },
  });
  const sessionUser = await getSessionUser(request);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {sessionUser && <Header />}
        <div className="flex flex-1 min-h-0">
          {sessionUser && <Sidebar />}
          <main className="flex-1 p-4 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
