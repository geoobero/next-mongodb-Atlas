import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Student Management System",
  description: "A modern student management application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
