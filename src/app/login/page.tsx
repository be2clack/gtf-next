'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Phone, KeyRound, ArrowLeft } from 'lucide-react'

type Step = 'phone' | 'pin'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [method, setMethod] = useState<string | null>(null)

  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/auth/send-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Ошибка отправки кода')
        return
      }

      setMethod(data.method)
      setStep('pin')
    } catch (err) {
      setError('Ошибка соединения. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: pin }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Неверный код')
        return
      }

      // Redirect based on user type
      router.push(data.redirectUrl || '/')
      router.refresh()
    } catch (err) {
      setError('Ошибка соединения. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep('phone')
    setPin('')
    setError(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {step === 'phone' ? 'Вход в систему' : 'Введите код'}
          </CardTitle>
          <CardDescription>
            {step === 'phone'
              ? 'Введите номер телефона для получения кода'
              : method === 'telegram'
              ? 'Код отправлен в Telegram'
              : 'Код отправлен по SMS'}
          </CardDescription>
        </CardHeader>

        {step === 'phone' ? (
          <form onSubmit={handleSendPin}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+996 XXX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Поддерживаются номера Кыргызстана, Казахстана, России и Узбекистана
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Получить код
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Вернуться на главную
                </Link>
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyPin}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="pin">Код подтверждения</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pin"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 text-center text-2xl tracking-widest"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Код действителен 5 минут
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading || pin.length < 6}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Войти
              </Button>
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleBack}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Назад
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={handleSendPin}
                  disabled={loading}
                >
                  Отправить снова
                </Button>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
