import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthState, LoginCredentials, OTPVerification } from '@/lib/types'

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ requiresOTP: boolean; email: string }>
  verifyOTP: (data: OTPVerification) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setLoading: (loading: boolean) => void
  
  // OTP State
  otpEmail: string | null
  setOtpEmail: (email: string | null) => void
}

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock user database for demo
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@moh.gov.et': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@moh.gov.et',
      phone: '+251911234567',
      firstName: 'Abebe',
      lastName: 'Kebede',
      role: 'system_admin',
      institution: 'Ministry of Health',
      department: 'ICT Directorate',
      position: 'System Administrator',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
    },
  },
  'psr@moh.gov.et': {
    password: 'psr123',
    user: {
      id: '2',
      email: 'psr@moh.gov.et',
      phone: '+251912345678',
      firstName: 'Tigist',
      lastName: 'Haile',
      role: 'psr_officer',
      institution: 'Ministry of Health',
      department: 'PSR Office',
      position: 'Senior Officer',
      status: 'active',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      lastLogin: new Date().toISOString(),
    },
  },
  'researcher@aau.edu.et': {
    password: 'research123',
    user: {
      id: '3',
      email: 'researcher@aau.edu.et',
      phone: '+251913456789',
      firstName: 'Dawit',
      lastName: 'Mengistu',
      role: 'researcher',
      institution: 'Addis Ababa University',
      department: 'School of Public Health',
      position: 'Associate Professor',
      status: 'active',
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
    },
  },
  'reviewer@moh.gov.et': {
    password: 'review123',
    user: {
      id: '4',
      email: 'reviewer@moh.gov.et',
      phone: '+251914567890',
      firstName: 'Sara',
      lastName: 'Tesfaye',
      role: 'roc_reviewer',
      institution: 'Ministry of Health',
      department: 'Research Oversight Committee',
      position: 'Technical Reviewer',
      status: 'active',
      createdAt: '2024-02-15T00:00:00Z',
      updatedAt: '2024-02-15T00:00:00Z',
      lastLogin: new Date().toISOString(),
    },
  },
  'director@moh.gov.et': {
    password: 'director123',
    user: {
      id: '5',
      email: 'director@moh.gov.et',
      phone: '+251915678901',
      firstName: 'Yohannes',
      lastName: 'Girma',
      role: 'director',
      institution: 'Ministry of Health',
      department: 'Policy & Planning',
      position: 'Director',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      lastLogin: new Date().toISOString(),
    },
  },
}

// Store for OTP codes (in-memory, simulates backend)
const otpStore: Record<string, string> = {}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      otpEmail: null,

      setLoading: (loading) => set({ isLoading: loading }),
      
      setOtpEmail: (email) => set({ otpEmail: email }),

      login: async (credentials) => {
        set({ isLoading: true })
        await delay(800) // Simulate network delay
        
        const mockUser = MOCK_USERS[credentials.email.toLowerCase()]
        
        if (!mockUser || mockUser.password !== credentials.password) {
          set({ isLoading: false })
          throw new Error('Invalid email or password')
        }
        
        // Generate mock OTP (in real app, this would be sent via SMS/email)
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        otpStore[credentials.email.toLowerCase()] = otp
        
        // Log OTP for demo purposes
        console.log(`[Demo] OTP for ${credentials.email}: ${otp}`)
        
        set({ 
          isLoading: false,
          otpEmail: credentials.email.toLowerCase(),
        })
        
        return { requiresOTP: true, email: credentials.email }
      },

      verifyOTP: async (data) => {
        set({ isLoading: true })
        await delay(600)
        
        const storedOTP = otpStore[data.email.toLowerCase()]
        
        // Accept "123456" as universal demo OTP
        if (data.otp !== storedOTP && data.otp !== '123456') {
          set({ isLoading: false })
          throw new Error('Invalid OTP code')
        }
        
        const mockUser = MOCK_USERS[data.email.toLowerCase()]
        if (!mockUser) {
          set({ isLoading: false })
          throw new Error('User not found')
        }
        
        // Generate mock JWT token
        const token = `mock_jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Clear OTP
        delete otpStore[data.email.toLowerCase()]
        
        set({
          user: mockUser.user,
          token,
          isAuthenticated: true,
          isLoading: false,
          otpEmail: null,
        })
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          otpEmail: null,
        })
      },

      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          })
        }
      },
    }),
    {
      name: 'psr-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
