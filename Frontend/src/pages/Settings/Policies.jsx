import { useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import { Input, Textarea } from '../../components/Field';
import { Button, ErrorState, Skeleton } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { publicApi, settingsApi } from '../../services';
import { RX, maxLen } from '../../utils/validators';
const T = (v, label) => (!v ? `${label} is required` : RX.time.test(v) ? '' : `${label} must be in 24-hour HH:MM format`);
/** PATCH /settings/policies and PATCH /settings/check-in-out. */
export default function Policies() {
    const toast = useToast();
    const { data: s, loading, error, reload } = useFetch(() => settingsApi.get(), []);
    const f = useForm({ checkInTime: '14:00', checkOutTime: '12:00', earlyCheckInAllowed: false, lateCheckOutAllowed: false, cancellationPolicy: '', bookingPolicy: '', privacyPolicy: '', termsAndConditions: '' }, v => ({ checkInTime: T(v.checkInTime, 'Check-in time'), checkOutTime: T(v.checkOutTime, 'Check-out time'), cancellationPolicy: maxLen(v.cancellationPolicy, 2000, 'Policy'), bookingPolicy: maxLen(v.bookingPolicy, 2000, 'Policy'), privacyPolicy: maxLen(v.privacyPolicy, 5000, 'Policy'), termsAndConditions: maxLen(v.termsAndConditions, 5000, 'Terms') }));
    useEffect(() => { if (s)
        f.setValues({ checkInTime: s.checkInTime ?? '14:00', checkOutTime: s.checkOutTime ?? '12:00', earlyCheckInAllowed: !!s.earlyCheckInAllowed, lateCheckOutAllowed: !!s.lateCheckOutAllowed, cancellationPolicy: s.cancellationPolicy ?? '', bookingPolicy: s.bookingPolicy ?? '', privacyPolicy: s.privacyPolicy ?? '', termsAndConditions: s.termsAndConditions ?? '' }); }, [s]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (e) => {
        e.preventDefault();
        f.submit(async (v) => {
            await settingsApi.patch('check-in-out', { checkInTime: v.checkInTime, checkOutTime: v.checkOutTime, earlyCheckInAllowed: v.earlyCheckInAllowed, lateCheckOutAllowed: v.lateCheckOutAllowed });
            await settingsApi.patch('policies', { cancellationPolicy: v.cancellationPolicy.trim(), bookingPolicy: v.bookingPolicy.trim(), privacyPolicy: v.privacyPolicy.trim(), termsAndConditions: v.termsAndConditions.trim() });
            publicApi.reset();
            toast.success('Policies saved');
            reload();
        });
    };
    const v = f.values, e = f.errors;
    return (<>
      <PageHeader back="/portal/settings" title="Policies & times" sub="Check-in / check-out times and the policies guests agree to."/>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading ? <Skeleton className="h-96"/> : !s ? <Alert kind="info">Create the hotel profile in Settings first.</Alert> : (<form onSubmit={go} noValidate className="glass grid max-w-3xl gap-4 rounded-2xl p-5 sm:grid-cols-2">
          {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
          <Input label="Check-in time" type="time" required value={v.checkInTime} onChange={f.onChange('checkInTime')} error={e.checkInTime}/><Input label="Check-out time" type="time" required value={v.checkOutTime} onChange={f.onChange('checkOutTime')} error={e.checkOutTime}/>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--gold))]" checked={v.earlyCheckInAllowed} onChange={f.onChange('earlyCheckInAllowed')}/>Allow early check-in</label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--gold))]" checked={v.lateCheckOutAllowed} onChange={f.onChange('lateCheckOutAllowed')}/>Allow late check-out</label>
          <div className="sm:col-span-2"><Textarea label="Cancellation policy" rows={3} value={v.cancellationPolicy} onChange={f.onChange('cancellationPolicy')} error={e.cancellationPolicy}/></div>
          <div className="sm:col-span-2"><Textarea label="Booking policy" rows={3} value={v.bookingPolicy} onChange={f.onChange('bookingPolicy')} error={e.bookingPolicy}/></div>
          <div className="sm:col-span-2"><Textarea label="Privacy policy" rows={3} value={v.privacyPolicy} onChange={f.onChange('privacyPolicy')} error={e.privacyPolicy}/></div>
          <div className="sm:col-span-2"><Textarea label="Terms & conditions" rows={3} value={v.termsAndConditions} onChange={f.onChange('termsAndConditions')} error={e.termsAndConditions}/></div>
          <div className="sm:col-span-2"><Button type="submit" loading={f.submitting}>Save policies</Button></div>
        </form>)}
    </>);
}
