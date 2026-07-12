import { useState } from 'react';

/**
 * Custom Hook to manage CAPTCHA verification state and actions.
 * @param onVerified Callback to invoke when CAPTCHA is successfully verified.
 */
export function useCaptcha(onVerified: (num1: number, num2: number, answer: number) => void) {
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);
  const [captchaParams, setCaptchaParams] = useState<{ num1: number; num2: number; answer: number } | null>(null);

  const handleCaptchaVerify = (verified: boolean, num1?: number, num2?: number, answer?: number) => {
    if (verified && num1 !== undefined && num2 !== undefined && answer !== undefined) {
      setIsCaptchaVerified(true);
      setCaptchaParams({ num1, num2, answer });
      setShowCaptchaModal(false);
      setTimeout(() => {
        onVerified(num1, num2, answer);
      }, 100);
    }
  };

  const resetCaptcha = () => {
    setIsCaptchaVerified(false);
    setCaptchaParams(null);
  };

  return {
    isCaptchaVerified,
    showCaptchaModal,
    setShowCaptchaModal,
    captchaParams,
    handleCaptchaVerify,
    resetCaptcha,
  };
}
