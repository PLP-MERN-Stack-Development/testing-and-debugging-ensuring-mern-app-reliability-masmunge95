import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center">
                <div className="mb-2 text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center">
                    <span className="mr-2">Powered by:</span>
                    <img src="/mongodb.png" alt="MongoDB" className="h-5 inline-block mx-1" />
                    <img src="/express.png" alt="Express.js" className="h-5 inline-block mx-1" />
                    <img src="/react.svg" alt="React" className="h-5 inline-block mx-1" />
                    <img src="/nodejs.png" alt="Node.js" className="h-5 inline-block mx-1" />
                    <img src="/clerk.jpeg" alt="Clerk" className="h-5 inline-block mx-1" />
                    <img src="/vite.svg" alt="Vite" className="h-5 inline-block mx-1" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">&copy; {currentYear} MERN Blog Manager. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default React.memo(Footer);