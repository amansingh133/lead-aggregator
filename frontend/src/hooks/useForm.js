import { useCallback, useState } from 'react';

// Small controlled-form helper: values/errors/handleChange/handleSubmit, with
// `setFieldErrors` so callers can drop in a backend VALIDATION_ERROR's
// per-field `details` directly (see utils/errorMessage.js `fieldErrors`).
export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback(
    (field) => (eventOrValue) => {
      const value =
        eventOrValue && eventOrValue.target
          ? eventOrValue.target.type === 'checkbox'
            ? eventOrValue.target.checked
            : eventOrValue.target.value
          : eventOrValue;
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    },
    []
  );

  const setFieldErrors = useCallback((fieldErrors) => {
    setErrors((prev) => ({ ...prev, ...fieldErrors }));
  }, []);

  const reset = useCallback((next = initialValues) => {
    setValues(next);
    setErrors({});
  }, [initialValues]);

  const handleSubmit = useCallback(
    (onSubmit) => async (event) => {
      event?.preventDefault?.();
      setSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setSubmitting(false);
      }
    },
    [values]
  );

  return { values, errors, submitting, handleChange, setFieldErrors, setValues, reset, handleSubmit };
}
