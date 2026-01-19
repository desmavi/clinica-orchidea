import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function Login() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { sendMagicLink, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/');
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) return;

    setIsSubmitting(true);

    const success = await sendMagicLink(email);

    if (success) {
      setEmailSent(true);
    }

    setIsSubmitting(false);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('login.checkEmail')}</CardTitle>
            <CardDescription className="text-base mt-2">
              {t('login.emailSent')}{' '}
              <span className="font-semibold text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 text-center text-sm text-muted-foreground">
              <p className="mb-2">
                {t('login.clickLink')}
              </p>
              <p className="text-xs">{t('login.linkExpiry')}</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setEmailSent(false)}
            >
              {t('login.useAnotherEmail')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">
            O
          </div>
          <CardTitle className="text-3xl">{t('login.title')}</CardTitle>
          <CardDescription className="text-base">
            {t('login.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                disabled={isSubmitting}
              />
              <p className="text-sm text-muted-foreground">
                {t('login.emailHint')}
              </p>
            </div>

            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? t('login.submitting') : t('login.submitButton')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>{t('login.noPassword')}</p>
            <p>{t('login.secureLink')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;