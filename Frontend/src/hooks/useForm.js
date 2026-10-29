import { useCallback, useState } from 'react';
/**
 * Small helper for controlled forms.
 *   const f = useForm({ email: '', password: '' }, validateLogin)
 *   <input value={f.values.email} onChange={f.onChange('email')} onBlur={f.onBlur('email')} />
 *   f.errors.email  → message shown under the field (only after the field was touched or submit was tried)
 *   await f.submit(async values => { ... })  → validates, shows loading, maps server errors onto fields
 */
export function useForm(initial, validate) {
    const [values, setValues] = useState(initial);
    const [touched, setTouched] = useState({});
    const [serverErrors, setServerErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [tried, setTried] = useState(false);
    const all = validate(values);
    const errors = {};
    Object.keys({ ...all, ...serverErrors }).forEach(k => { const m = serverErrors[k] || all[k]; if (m && (tried || touched[k] || serverErrors[k]))
        errors[k] = m; });
    const set = useCallback((k, v) => { setValues(p => ({ ...p, [k]: v })); setServerErrors(p => { if (!p[k])
        return p; const n = { ...p }; delete n[k]; return n; }); setFormError(''); }, []);
    const onChange = (k) => (e) => set(k, (e.target.type === 'checkbox' ? e.target.checked : e.target.value));
    const onBlur = (k) => () => setTouched(p => ({ ...p, [k]: true }));
    const reset = useCallback((v) => { setValues(v ?? initial); setTouched({}); setServerErrors({}); setFormError(''); setTried(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    /** Returns true when the callback succeeded. */
    const submit = async (fn) => {
        setTried(true);
        setFormError('');
        if (Object.values(validate(values)).some(Boolean)) {
            setFormError('Please fix the highlighted fields.');
            return false;
        }
        setSubmitting(true);
        try {
            await fn(values);
            return true;
        }
        catch (e) {
            const err = e;
            if (err?.fields && Object.keys(err.fields).length) {
                setServerErrors(err.fields);
                setFormError(err.message && !/validation/i.test(err.message) ? err.message : 'Please fix the highlighted fields.');
            }
            else
                setFormError(err?.message || 'Something went wrong. Please try again.');
            return false;
        }
        finally {
            setSubmitting(false);
        }
    };
    return { values, errors, set, setValues, onChange, onBlur, reset, submit, submitting, formError, setFormError };
}
