'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AuthLoadingOverlayProps {
  isLoading: boolean;
  isSuccess: boolean;
  steps: {
    authenticating: string;
    settingUp: string;
    redirecting: string;
  };
}

export function AuthLoadingOverlay({ isLoading, isSuccess, steps }: AuthLoadingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
      setCurrentStep(0);

      // Progress through steps
      const timer1 = setTimeout(() => setCurrentStep(1), 800);
      const timer2 = setTimeout(() => setCurrentStep(2), 1600);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else if (isSuccess) {
      // When success, show success state and keep showing until page navigation
      setCurrentStep(2);
      // Don't hide automatically - let the redirect happen naturally
      // The overlay will disappear when component unmounts on navigation
    } else {
      setShow(false);
      setCurrentStep(0);
    }
  }, [isLoading, isSuccess]);

  if (!show) return null;

  const stepMessages = [steps.authenticating, steps.settingUp, steps.redirecting];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/30 backdrop-blur-[2px] animate-in fade-in duration-200">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-2">
        <CardContent className="pt-6 pb-8 px-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Icon */}
            <div className="relative">
              {isSuccess ? (
                <div className="animate-in zoom-in duration-300">
                  <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in duration-500" />
                </div>
              ) : (
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              )}
            </div>

            {/* Message */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">
                {isSuccess ? 'Success!' : stepMessages[currentStep] || stepMessages[0]}
              </h3>
              {!isSuccess && (
                <p className="text-sm text-muted-foreground">
                  Please wait while we process your request...
                </p>
              )}
              {isSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400 animate-in fade-in duration-300">
                  Redirecting you to your dashboard
                </p>
              )}
            </div>

            {/* Progress Steps */}
            {!isSuccess && (
              <div className="w-full space-y-3">
                {stepMessages.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 transition-all duration-300 ${
                      index <= currentStep ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        index < currentStep
                          ? 'bg-primary text-primary-foreground'
                          : index === currentStep
                            ? 'bg-primary/20 border-2 border-primary'
                            : 'bg-muted'
                      }`}
                    >
                      {index < currentStep ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-sm transition-all duration-300 ${
                        index === currentStep
                          ? 'font-semibold text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Loading Bar */}
            {!isSuccess && (
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-1000 ease-in-out rounded-full"
                  style={{
                    width: `${((currentStep + 1) / stepMessages.length) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
