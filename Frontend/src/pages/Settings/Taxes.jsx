import { useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import { Input } from '../../components/Field';
import { Button, ErrorState, Skeleton } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { publicApi, settingsApi } from '../../services';
const pct = (v, label) => (v.trim() === '' ? `${label} is required` : !Number.isFinite(Number(v)) || Number(v) < 0 || Number(v) > 100 ? `${label} must be between 0 and 100` : '');
/** PATCH /settings/tax - tax % and service-charge %. New bookings suggest these amounts. */
export default function Taxes() {
    const toast = useToast();
    const { data: s, loading, error, reload } = useFetch(() => settingsApi.get(), []);
    const f = useForm({ taxEnabled: false, taxPercentage: '0', serviceChargeEnabled: false, serviceChargePercentage: '0' }, v => ({ taxPercentage: v.taxEnabled ? pct(v.taxPercentage, 'Tax') : '', serviceChargePercentage: v.serviceChargeEnabled ? pct(v.serviceChargePercentage, 'Service charge') : '' }));
    useEffect(() => { if (s)
        f.setValues({ taxEnabled: !!s.taxEnabled, taxPercentage: String(s.taxPercentage ?? 0), serviceChargeEnabled: !!s.serviceChargeEnabled, serviceChargePercentage: String(s.serviceChargePercentage ?? 0) }); }, [s]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (e) => { e.preventDefault(); f.submit(async (v) => { await settingsApi.patch('tax', { taxEnabled: v.taxEnabled, taxPercentage: Number(v.taxPercentage) || 0, serviceChargeEnabled: v.serviceChargeEnabled, serviceChargePercentage: Number(v.serviceChargePercentage) || 0 }); publicApi.reset(); toast.success('Tax settings saved'); reload(); }); };
    const v = f.values;
    return (<>
      <PageHeader back="/portal/settings" title="Taxes & service charge" sub="Applied as suggestions when creating reservations and online bookings."/>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading ? <Skeleton className="h-64"/> : !s ? <Alert kind="info">Create the hotel profile in Settings first.</Alert> : (<form onSubmit={go} noValidate className="glass grid max-w-2xl gap-5 rounded-2xl p-5 sm:grid-cols-2">
          {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
          <div className="space-y-3"><label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--gold))]" checked={v.taxEnabled} onChange={f.onChange('taxEnabled')}/>Charge tax</label><Input label="Tax %" type="number" min={0} max={100} step="any" disabled={!v.taxEnabled} value={v.taxPercentage} onChange={f.onChange('taxPercentage')} error={f.errors.taxPercentage}/></div>
          <div className="space-y-3"><label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--gold))]" checked={v.serviceChargeEnabled} onChange={f.onChange('serviceChargeEnabled')}/>Charge service fee</label><Input label="Service charge %" type="number" min={0} max={100} step="any" disabled={!v.serviceChargeEnabled} value={v.serviceChargePercentage} onChange={f.onChange('serviceChargePercentage')} error={f.errors.serviceChargePercentage}/></div>
          <div className="sm:col-span-2"><Button type="submit" loading={f.submitting}>Save</Button></div>
        </form>)}
    </>);
}
