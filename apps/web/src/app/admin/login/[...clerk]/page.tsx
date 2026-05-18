import { SignIn } from '@clerk/nextjs';

export default function ClerkCatchAllSignIn() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 flex items-center justify-center p-4">
      <div className="relative z-10">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-2xl',
              headerTitle: 'text-2xl font-bold',
              headerSubtitle: 'text-gray-600',
              formButtonPrimary:
                'bg-brand-gradient hover-brand-gradient',
            },
          }}
          routing="path"
          path="/admin/login"
          signUpUrl="/sign-up"
          afterSignInUrl="/admin"
        />
      </div>
    </div>
  );
}
