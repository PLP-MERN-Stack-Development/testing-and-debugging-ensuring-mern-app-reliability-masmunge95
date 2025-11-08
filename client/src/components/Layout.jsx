import React, { useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTheme } from '@/context/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';

/**
 * A layout component that wraps page content with a standard Header and Footer.
 */
export default function Layout({ children }) {
    const { theme } = useTheme();
    const scrollTargetRef = useRef(null);
    
    return (
        <div className={`min-h-screen flex flex-col scroll-smooth ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <Header scrollTargetRef={scrollTargetRef} />
            <main className="flex-grow container mx-auto px-4 py-8 mt-16 scroll-mt-20">
                <ErrorBoundary>
                    {/* Conditionally inject the prop only for HomePage to avoid side effects on other pages */}
                    {children.type.name === 'HomePage'
                        ? React.cloneElement(children, {
                              ...children.props,
                              setScrollTarget: (el) => (scrollTargetRef.current = el),
                          })
                        : children}
                </ErrorBoundary>
            </main>
            <Footer />
        </div>
    );
}