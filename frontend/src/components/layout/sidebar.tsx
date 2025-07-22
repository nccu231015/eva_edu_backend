'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Award, GanttChartSquare } from 'lucide-react';

const links = [
  { href: '/awards', text: '獎項管理', icon: Award },
  { href: '/summaries', text: '年份區段管理', icon: GanttChartSquare },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-gray-50 p-6 border-r">
            <div className="mb-8">
                <h2 className="text-xl font-bold">EVA EDU</h2>
            </div>
            <nav>
                <ul>
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname.startsWith(link.href);
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`flex items-center p-3 my-1 rounded-lg transition-colors ${
                                        isActive
                                            ? 'bg-gray-200 text-gray-900'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon className="w-5 h-5 mr-3" />
                                    <span>{link.text}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
} 