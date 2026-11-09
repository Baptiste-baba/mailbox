import { useState } from 'react';

/** A code being typed, and why it is refused, if it is: the refusal goes once the code changes. */
export function useCodeInput() {
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string>();
  return {
    code,
    codeError,
    setCodeError,
    changeCode: (typed: string) => {
      setCode(typed);
      setCodeError(undefined);
    },
    clear: () => {
      setCode('');
      setCodeError(undefined);
    },
  };
}
