import React from 'react';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-slate-800 text-white flex-shrink-0 p-4">
      <div className="text-2xl font-bold mb-10">
        SkillSphere
      </div>
      <nav>
        <ul>
          <li className="mb-4">
            <a href="#" className="flex items-center p-2 bg-slate-700 rounded-md text-sm">
              <span>Dashboard</span>
            </a>
          </li>
          <li className="mb-4">
            <a href="#" className="flex items-center p-2 hover:bg-slate-700 rounded-md text-sm">
              <span>Profile</span>
            </a>
          </li>
          <li className="mb-4">
            <a href="#" className="flex items-center p-2 hover:bg-slate-700 rounded-md text-sm">
              <span>Settings</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;