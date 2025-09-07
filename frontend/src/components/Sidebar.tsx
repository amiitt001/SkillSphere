'use client'; // This component now uses a hook, so it must be a client component

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Import the hook

const Sidebar = () => {
  const pathname = usePathname(); // Get the current URL path

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/history', label: 'History' },
    // You can add more links here in the future
  ];

  return (
    <aside className="w-64 bg-slate-800 text-white flex-shrink-0 p-4">
      <div className="text-2xl font-bold mb-10">
        SkillSphere
      </div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.href} className="mb-4">
              <Link 
                href={item.href} 
                className={`flex items-center p-2 rounded-md text-sm transition-colors ${
                  pathname === item.href 
                    ? 'bg-sky-600' // Active link style
                    : 'hover:bg-slate-700' // Inactive link style
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
