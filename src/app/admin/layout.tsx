"use client"

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

const navLinks = [
  { name: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { name: "Services", href: "/admin/services", icon: "📄" },
  { name: "FAQs", href: "/admin/faqs", icon: "❓" },
  { name: "Reports", href: "/admin/reports", icon: "📈" },
];

function Sidebar({ pathname }: { pathname: string }) {
  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem("isAdminAuthenticated");
    router.push("/admin/login");
  };
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-20 flex flex-col">
      <div className="flex items-center gap-2 px-6 py-8">
        <Image src="/baranguide-log.png" alt="BaranGuide Logo" width={40} height={40} />
        <span className="text-2xl font-bold text-[#1a237e]">BaranGuide</span>
      </div>
      <nav className="flex-1 px-2 space-y-2">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
              pathname === link.href
                ? "bg-[#ede7f6] text-[#5f3dc4] font-bold"
                : "text-gray-700 hover:bg-[#ede7f6] hover:text-[#5f3dc4]"
            }`}
          >
            <span className="text-xl">{link.icon}</span>
            {link.name}
          </Link>
        ))}
      </nav>
      <div className="px-6 pb-8 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full py-2 bg-[#e53935] text-white rounded font-semibold hover:bg-[#b71c1c] transition"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("isAdminAuthenticated");
      if (!isAuth && pathname !== "/admin/login") {
        router.push("/admin/login");
      }
    }
  }, [router, pathname]);

  // Only show sidebar and background if not on login page
  const isLoginPage = pathname === "/admin/login";

  return (
    <div className="relative min-h-screen bg-gray-100 overflow-hidden">
      {/* Blurred Barangay Seal Background */}
      {!isLoginPage && (
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <Image
            src="/barangay-seal.png"
            alt="Barangay Old Cabalan Seal"
            fill
            style={{ objectFit: "cover" }}
            className="blur-2xl opacity-20"
            priority
          />
        </div>
      )}
      {/* Sidebar */}
      {!isLoginPage && <Sidebar pathname={pathname} />}
      {/* Main Content */}
      <main className={`relative z-10 flex-1 min-h-screen transition-all duration-200 ${!isLoginPage ? 'ml-64 p-8' : 'p-0'}`}> 
        {children}
      </main>
    </div>
  );
}