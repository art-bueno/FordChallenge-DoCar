/*a*/
import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useRouter, useSegments } from 'expo-router'
import { storage } from '@/services/api'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const segments = useSegments()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const token = await storage.get('access_token')
    const inAuth = segments[0] === '(auth)'

    if (!token && !inAuth) {
      router.replace('/(auth)/login')
    } else if (token && inAuth) {
      router.replace('/(tabs)')
    }

    setChecked(true)
  }

  if (!checked) return null

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthGuard>
    </>
  )
}