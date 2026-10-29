import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Percent, ScrollText, Tag } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import { Panel } from '../../components/common/Detail';
import { Input, Textarea } from '../../components/Field';
import { Button, ErrorState, Skeleton } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { publicApi, settingsApi } from '../../services';
import { setCurrency } from '../../utils/formatCurrency';
import { RX, emailRule, maxLen, phoneRule } from '../../utils/validators';
const LINKS = [{ to: '/portal/settings/rates', label: 'Room rates', icon: Tag, text: 'Base price per night for each room type.' }, { to: '/portal/settings/taxes', label: 'Taxes & service charge', icon: Percent, text: 'Percentages added to new bookings.' }, { to: '/portal/settings/policies', label: 'Policies & times', icon: ScrollText, text: 'Cancellation, booking, privacy and check-in/out times.' }];
export const useHotelSettings = () => useFetch(() => settingsApi.get(), []);
/** General hotel settings: GET /settings, POST /settings (first-time setup), PUT /settings, PATCH /settings/notifications, PATCH /settings/maintenance-mode (Admin). */
export default function Settings() {
    const { user } = useAuth();
    const toast = useToast();
    const { data: s, loading, error, reload } = useHotelSettings();
    const f = useForm({ hotelName: '', email: '', phone: '', address: '', city: '', country: '', website: '', currency: 'PKR', hotelDescription: '' }, v => ({
        hotelName: !v.hotelName.trim() ? 'Hotel name is required' : v.hotelName.trim().length < 2 ? 'Hotel name must be at least 2 characters' : maxLen(v.hotelName, 150, 'Hotel name'), email: emailRule(v.email), phone: phoneRule(v.phone, false), address: maxLen(v.address, 200, 'Address'),
        website: v.website && !/^https?:\/\/\S+\.\S+$/i.test(v.website.trim()) ? 'Use a full link such as https://example.com' : '', currency: RX.currency.test(v.currency.trim()) ? '' : 'Use a currency code like PKR or USD', hotelDescription: maxLen(v.hotelDescription, 1000, 'Description')
    }));
    useEffect(() => { if (s)
        f.setValues({ hotelName: s.hotelName ?? '', email: s.email ?? '', phone: s.phone ?? '', address: s.address ?? '', city: s.city ?? '', country: s.country ?? '', website: s.website ?? '', currency: s.currency ?? 'PKR', hotelDescription: s.hotelDescription ?? '' }); }, [s]); // eslint-disable-line react-hooks/exhaustive-deps
    const save = (e) => {
        e.preventDefault();
        f.submit(async (v) => {
            const body = { ...v, hotelName: v.hotelName.trim(), email: v.email.trim().toLowerCase(), currency: v.currency.trim().toUpperCase() };
            s ? await settingsApi.update(body) : await settingsApi.create(body);
            setCurrency(body.currency);
            publicApi.reset();
            toast.success('Settings saved');
            reload();
        });
    };
    const flip = async (section, body) => { try {
        await settingsApi.patch(section, body);
        publicApi.reset();
        toast.success('Setting updated');
        reload();
    }
    catch (e) {
        toast.error(e.message);
    } };
    if (error)
        return <><PageHeader title="Settings"/><ErrorState onRetry={reload} message={error}/></>;
    const v = f.values, e = f.errors;
    const toggles = [['emailNotificationsEnabled', 'E-mail notifications'], ['bookingNotificationsEnabled', 'Booking alerts'], ['paymentNotificationsEnabled', 'Payment alerts'], ['maintenanceNotificationsEnabled', 'Maintenance alerts'], ['housekeepingNotificationsEnabled', 'Housekeeping alerts'], ['serviceNotificationsEnabled', 'Service request alerts'], ['feedbackNotificationsEnabled', 'Feedback alerts']];
    return (<>
      <PageHeader title="Settings" sub="Hotel profile, defaults and system switches."/>
      <div className="mb-6 grid gap-4 md:grid-cols-3">{LINKS.map(l => <Link key={l.to} to={l.to} className="glass rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-gold"><l.icon className="text-gold-ink" size={20}/><p className="mt-3 font-serif text-xl">{l.label}</p><p className="mt-1 text-sm text-mist">{l.text}</p></Link>)}</div>
      {loading ? <Skeleton className="h-96"/> : (<div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={save} noValidate className="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-2 lg:col-span-2">
            <h2 className="font-serif text-xl sm:col-span-2">Hotel profile</h2>
            {!s && <div className="sm:col-span-2"><Alert kind="info">Settings have not been created yet. Fill in the form to set up the hotel.</Alert></div>}
            {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
            <div className="sm:col-span-2"><Input label="Hotel name" required maxLength={150} value={v.hotelName} onChange={f.onChange('hotelName')} onBlur={f.onBlur('hotelName')} error={e.hotelName}/></div>
            <Input label="Contact email" type="email" required value={v.email} onChange={f.onChange('email')} onBlur={f.onBlur('email')} error={e.email}/><Input label="Phone" type="tel" value={v.phone} onChange={f.onChange('phone')} onBlur={f.onBlur('phone')} error={e.phone}/>
            <div className="sm:col-span-2"><Input label="Address" maxLength={200} value={v.address} onChange={f.onChange('address')} error={e.address}/></div>
            <Input label="City" value={v.city} onChange={f.onChange('city')}/><Input label="Country" value={v.country} onChange={f.onChange('country')}/>
            <Input label="Website" type="url" value={v.website} onChange={f.onChange('website')} onBlur={f.onBlur('website')} error={e.website} placeholder="https://"/><Input label="Currency code" maxLength={5} value={v.currency} onChange={f.onChange('currency')} onBlur={f.onBlur('currency')} error={e.currency} hint="e.g. PKR, USD, EUR"/>
            <div className="sm:col-span-2"><Textarea label="Short description (shown in the footer)" rows={3} maxLength={1000} value={v.hotelDescription} onChange={f.onChange('hotelDescription')} error={e.hotelDescription}/></div>
            <div className="sm:col-span-2"><Button type="submit" loading={f.submitting}>{s ? 'Save settings' : 'Create settings'}</Button></div>
          </form>
          <div className="space-y-6">
            <Panel title="Notifications"><ul className="space-y-3">{toggles.map(([k, label]) => <li key={k}><label className="flex items-center justify-between gap-3 text-sm"><span>{label}</span><input type="checkbox" disabled={!s} className="h-4 w-4 accent-[rgb(var(--gold))]" checked={s?.[k] !== false} onChange={ev => flip('notifications', { [k]: ev.target.checked })}/></label></li>)}</ul></Panel>
            {user?.role === 'admin' && <Panel title="Maintenance mode"><label className="flex items-center justify-between gap-3 text-sm"><span>Show the site as under maintenance</span><input type="checkbox" disabled={!s} className="h-4 w-4 accent-[rgb(var(--gold))]" checked={!!s?.maintenanceMode} onChange={ev => flip('maintenance-mode', { maintenanceMode: ev.target.checked })}/></label></Panel>}
          </div>
        </div>)}
    </>);
}
