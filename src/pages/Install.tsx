import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Smartphone className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Install TimeTrack Pro</CardTitle>
          <CardDescription>
            Install our app on your device for quick access and offline support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-success" />
              </div>
              <p className="text-lg font-medium text-success">App is already installed!</p>
              <Link to="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go to App
                </Button>
              </Link>
            </div>
          ) : isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                To install on iOS:
              </p>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <span>Tap the <strong>Share</strong> button in Safari</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                  <span>Tap <strong>"Add"</strong> to confirm</span>
                </li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} className="w-full" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Install App
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                To install on Android:
              </p>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <span>Tap the <strong>menu</strong> (three dots) in Chrome</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <span>Tap <strong>"Add to Home screen"</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                  <span>Tap <strong>"Add"</strong> to confirm</span>
                </li>
              </ol>
            </div>
          )}

          <div className="pt-4 border-t">
            <Link to="/">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
