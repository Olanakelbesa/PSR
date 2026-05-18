import { create } from 'zustand'

interface AuthState {
  otpEmail: string | null
  isLoading: boolean
  setOtpEmail: (email: string | null) => void
  verifyOTP: (data: { email: string; otp: string }) => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  otpEmail: null,
  isLoading: false,
  setOtpEmail: (email) => set({ otpEmail: email }),
  verifyOTP: async (data) => {
    set({ isLoading: true })
    try {
      // Stub for build passing, we use NextAuth for actual auth now
      console.log('Verifying OTP for', data.email)
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      set({ isLoading: false })
    }
  },
}))
