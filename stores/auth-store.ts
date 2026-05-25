import { create } from 'zustand'

type OtpIntent = 'registration' | 'password-reset'

interface AuthState {
  otpEmail: string | null
  otpIntent: OtpIntent | null
  isLoading: boolean
  beginOtpFlow: (data: { email: string; intent: OtpIntent }) => void
  clearOtpFlow: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  otpEmail: null,
  otpIntent: null,
  isLoading: false,
  beginOtpFlow: ({ email, intent }) => set({ otpEmail: email, otpIntent: intent }),
  clearOtpFlow: () => set({ otpEmail: null, otpIntent: null }),
}))
