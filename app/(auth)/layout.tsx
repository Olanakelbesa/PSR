import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold">PSR Platform</span>
            </div>
            <p className="text-primary-foreground/80 text-lg">
              Ministry of Health - Ethiopia
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold leading-tight text-balance">
                Policy & System Reform Platform
              </h1>
              <p className="mt-4 text-lg text-primary-foreground/80 leading-relaxed max-w-md">
                A comprehensive platform for managing policy documents, research proposals, and institutional partnerships for health system strengthening.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-primary-foreground/10 rounded-lg p-4">
                <div className="text-3xl font-bold">150+</div>
                <div className="text-sm text-primary-foreground/70">Policy Documents</div>
              </div>
              <div className="bg-primary-foreground/10 rounded-lg p-4">
                <div className="text-3xl font-bold">85</div>
                <div className="text-sm text-primary-foreground/70">Active Projects</div>
              </div>
              <div className="bg-primary-foreground/10 rounded-lg p-4">
                <div className="text-3xl font-bold">50+</div>
                <div className="text-sm text-primary-foreground/70">Partner Institutions</div>
              </div>
              <div className="bg-primary-foreground/10 rounded-lg p-4">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-primary-foreground/70">Registered Users</div>
              </div>
            </div>
          </div>

          <div className="text-sm text-primary-foreground/60">
            Federal Democratic Republic of Ethiopia
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary-foreground/5 rounded-full" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-foreground/5 rounded-full" />
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
