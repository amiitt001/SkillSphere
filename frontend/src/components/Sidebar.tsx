'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image'; // Import the Next.js Image component

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/history', label: 'History' },
  ];

  return (
    <aside className="w-64 bg-slate-800 text-white flex-shrink-0 p-4 flex flex-col">
      {/* --- THIS IS THE UPDATED PART --- */}
      <div className="mb-10">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.jpg" // The path starts from the 'public' folder
            alt="SkillSphere Logo"
            width={40} // Specify the width
            height={40} // Specify the height
            priority // Helps load the logo faster
          />
          <span className="text-2xl font-bold">SkillSphere</span>
        </Link>
      </div>
      {/* --- END OF UPDATE --- */}

      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.href} className="mb-4">
              <Link
                href={item.href}
                className={`flex items-center p-2 rounded-md text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-sky-600'
                    : 'hover:bg-slate-700'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;