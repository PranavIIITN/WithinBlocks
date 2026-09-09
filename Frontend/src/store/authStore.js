import { create } from 'zustand'

const parseJSON = (key) => {
  try {
    const item = localStorage.getItem(key)
    return item && item !== 'undefined' ? JSON.parse(item) : null
  } catch {
    return null
  }
}

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: parseJSON('user'),
  company: parseJSON('company'),

  setAuth: (token, user, company) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('company', JSON.stringify(company))
    set({ token, user, company })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('company')
    set({ token: null, user: null, company: null })
  },
}))

export default useAuthStore