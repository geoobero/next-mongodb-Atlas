import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "Student Management System",
  description: "A modern student management application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          {children}
        </main>
      </body>
    </html>
  );
}
