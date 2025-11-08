import React from 'react';
import { SignedIn, SignedOut, useSession, SignUpButton } from '@clerk/clerk-react';
import Button from '@/components/Button';
import Dashboard from './Dashboard';
import PublicPostList from '@/components/PublicPostList';

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

const PenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>;
const CategoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const AuthIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;

// This wrapper component prevents the `unsafeMetadata` prop from being passed to the DOM element.
// It accepts the props from SignUpButton, strips out the one it doesn't need, and forwards the rest.
const SignUpButtonWrapper = React.forwardRef(({ children, unsafeMetadata, ...props }, ref) => {
  return (
    <Button {...props} ref={ref}>
      {children}
    </Button>
  );
});

export default function HomePage({ setScrollTarget }) {
  const { isLoaded, session } = useSession();

  // Show a loading state while Clerk is initializing
  if (!isLoaded) {
    return <div className="text-center p-12">Loading...</div>;
  }

// Determine the user's role from the active session's user object for accuracy.
  const isEditor = session?.user?.publicMetadata?.role === 'editor';

  return (
    <>
      <SignedIn>
        {/* If the user is an editor, show the dashboard. Otherwise, show the public post list. */}
        {isEditor ? <Dashboard /> : <PublicPostList />}
      </SignedIn>
      <SignedOut>
        <div>
          {/* Hero Section */}
          <section ref={setScrollTarget} className="text-center py-16">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl max-w-4xl mx-auto mb-15">
              Welcome to <span className="text-blue-600 dark:text-blue-400">MERN Blog Manager!</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg mb-15">
              Welcome to your corner of the internet — a place to read, write, and share what matters.<br />
              Built with care on MERN, and kept safe by Clerk. Sign in below to start creating or exploring.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <SignUpButton mode="modal" unsafeMetadata={{ role: 'editor' }}>
                <SignUpButtonWrapper size="lg" variant="primary">
                  Join as a Contributor
                </SignUpButtonWrapper>
              </SignUpButton>
              <SignUpButton mode="modal" unsafeMetadata={{ role: 'viewer' }}>
                <SignUpButtonWrapper size="lg" variant="secondary">
                  Join as a Reader
                </SignUpButtonWrapper>
              </SignUpButton>
            </div>
          </section>

          {/* Features Section */}
          <section>
            <h2 className="text-3xl font-bold text-center mb-12 ">
              Features
            </h2>
            <p className="text-center mx-auto max-w-2xl text-lg mb-12">
              Discover the features that make MERN Blog more than just another platform —
              your space to write, explore, and share ideas that matter.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> 
              <FeatureCard
                icon={<PenIcon />}
                title="Full Post Control"
                description={ 
                  <>
                    <span className="block font-bold">Create, edit, or delete posts with ease.</span><br />
                    <span className="block">Whether you're polishing a masterpiece or clearing out old drafts, managing content feels intuitive — no tech manual required.</span>
                  </>
                }
              />
              <FeatureCard
                icon={<CategoryIcon />}
                title="Organized by Design"
                description={
                  <>
                    <span className="block font-bold">Bring order to your creativity.</span><br />
                    <span className="block">Build and manage categories that keep your ideas tidy and your readers exploring with ease. A little structure goes a long way.</span>
                  </>
                }
              />
              <FeatureCard
                icon={<AuthIcon />}
                title="Effortless Security"
                description={
                  <>
                    <span className="block font-bold">Sign in seamlessly and safely.</span><br />
                    <span className="block">Clerk keeps your data protected behind the scenes so you can focus on sharing your voice — stress-free and secure.</span>
                  </>
                }
              />
            </div>
          </section>
        </div>
      </SignedOut>
    </>
  );
}