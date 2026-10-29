import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, Check, Send, Trash2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import { Input, Select, Textarea } from '../../components/Field';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { Chips, Toolbar } from '../../components/common/Toolbar';
import { useAuth } from '../../hooks/useAuth';
import { useFetch, useList } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../../components/common/Toast';
import { notificationApi, userApi } from '../../services';
import { NOTIFICATION_PRIORITIES, NOTIFICATION_TYPES, labelOf } from '../../utils/constants';
import { timeAgo } from '../../utils/formatDate';
import { nameOf } from '../../utils/entity';
import { ADMIN_MGR, can } from '../../utils/permissions';
import { maxLen } from '../../utils/validators';
/** The server stores links like /reservations/:id or /service-requests/:id; the app's routes live under /portal. */
export const portalLink = (url) => { if (!url)
    return ''; if (url.startsWith('/portal'))
    return url; return '/portal' + url.replace(/^\/service-requests/, '/services/requests'); };
/** GET /notifications/my · PATCH /:id/read · PATCH /mark-all-read · DELETE /:id · DELETE /read · POST (Admin/Manager). */
export default function Notifications() {
    const { user } = useAuth();
    const nav = useNavigate();
    const toast = useToast();
    const { refresh } = useNotifications();
    const [tab, setTab] = useState('All');
    const [send, setSend] = useState(false);
    const list = useList(page => notificationApi.list({ page, limit: 15, isRead: tab === 'Unread' ? 'false' : undefined }), [tab]);
    const after = () => { list.reload(); refresh(); };
    const act = async (fn, ok) => { try {
        await fn();
        if (ok)
            toast.success(ok);
        after();
    }
    catch (e) {
        toast.error(e.message);
    } };
    const open = async (n) => { if (!n.isRead) {
        try {
            await notificationApi.markRead(n._id);
            refresh();
        }
        catch { /* non-critical */ }
    } const to = portalLink(n.actionUrl); if (to)
        nav(to);
    else
        list.reload(); };
    return (<>
      <PageHeader title="Notifications" sub="Updates about bookings, payments, tasks and more." actions={<>{can(user?.role, ...ADMIN_MGR) && <Button variant="outline" onClick={() => setSend(true)}><Send size={16}/> Send</Button>}<Button variant="glass" onClick={() => act(() => notificationApi.markAllRead(), 'All marked as read')}><Check size={16}/> Mark all read</Button><Button variant="glass" onClick={() => act(() => notificationApi.removeRead(), 'Read notifications cleared')}><Trash2 size={16}/> Clear read</Button></>}/>
      <Toolbar><Chips value={tab} onChange={setTab} options={['Unread']}/></Toolbar>
      {list.error ? <ErrorState onRetry={list.reload} message={list.error}/> : list.loading ? <Skeleton className="h-48"/> : !list.items.length ? <div className="glass rounded-2xl"><EmptyState title={tab === 'Unread' ? 'You are all caught up' : 'No notifications'} text="New updates will appear here."/></div> : (<ul className="glass divide-y divide-wash/10 overflow-hidden rounded-2xl">{list.items.map(n => (<li key={n._id} className={`flex items-start gap-3 p-4 ${n.isRead ? '' : 'bg-gold/[0.06]'}`}>
            <span className="mt-1 shrink-0 text-gold-ink">{n.isRead ? <Bell size={18}/> : <BellRing size={18}/>}</span>
            <button type="button" onClick={() => open(n)} className="min-w-0 flex-1 text-left"><p className={`text-sm ${n.isRead ? '' : 'font-medium'}`}>{n.title}</p><p className="mt-0.5 text-sm text-mist">{n.message}</p><p className="mt-1 flex items-center gap-2 text-xs text-muted">{timeAgo(n.createdAt)} · {labelOf(n.type)}{['HIGH', 'URGENT'].includes(n.priority) && <StatusBadge status={n.priority}/>}</p></button>
            <div className="flex shrink-0 gap-1">{!n.isRead && <button aria-label="Mark as read" title="Mark as read" onClick={() => act(() => notificationApi.markRead(n._id))} className="rounded-full p-2 text-mist hover:text-gold-ink"><Check size={16}/></button>}<button aria-label="Delete notification" title="Delete" onClick={() => act(() => notificationApi.remove(n._id))} className="rounded-full p-2 text-mist hover:text-red-500"><Trash2 size={16}/></button></div>
          </li>))}</ul>)}
      {list.pages > 1 && <div className="mt-4 flex items-center justify-center gap-3 text-sm"><Button variant="glass" disabled={list.page <= 1} onClick={() => list.setPage(list.page - 1)}>Previous</Button><span className="text-mist">Page {list.page} of {list.pages}</span><Button variant="glass" disabled={list.page >= list.pages} onClick={() => list.setPage(list.page + 1)}>Next</Button></div>}
      <SendDialog open={send} onClose={() => setSend(false)}/>
    </>);
}
function SendDialog({ open, onClose }) {
    const toast = useToast();
    const users = useFetch(async () => (await userApi.list({ isActive: 'true', limit: 100 })).items, [open], open);
    const f = useForm({ recipient: '', title: '', message: '', type: 'GENERAL', priority: 'NORMAL' }, v => ({ recipient: v.recipient ? '' : 'Choose a recipient', title: !v.title.trim() ? 'Title is required' : maxLen(v.title, 150, 'Title'), message: !v.message.trim() ? 'Message is required' : maxLen(v.message, 1000, 'Message') }));
    useEffect(() => { if (open)
        f.reset(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (e) => { e.preventDefault(); f.submit(async (v) => { await notificationApi.send({ recipient: v.recipient, title: v.title.trim(), message: v.message.trim(), type: v.type, priority: v.priority }); toast.success('Notification sent'); onClose(); }); };
    return (<Modal open={open} onClose={onClose} title="Send a notification"><form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2">
      {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
      <div className="sm:col-span-2"><Select label="Recipient" required value={f.values.recipient} onChange={f.onChange('recipient')} error={f.errors.recipient} hint={users.loading ? 'Loading…' : undefined}><option value="">Select…</option>{users.data?.map(u => <option key={u._id} value={u._id}>{nameOf(u)} ({u.role})</option>)}</Select></div>
      <div className="sm:col-span-2"><Input label="Title" required maxLength={150} value={f.values.title} onChange={f.onChange('title')} onBlur={f.onBlur('title')} error={f.errors.title}/></div>
      <div className="sm:col-span-2"><Textarea label="Message" required rows={3} maxLength={1000} value={f.values.message} onChange={f.onChange('message')} onBlur={f.onBlur('message')} error={f.errors.message}/></div>
      <Select label="Type" value={f.values.type} onChange={f.onChange('type')}>{NOTIFICATION_TYPES.map(t => <option key={t} value={t}>{labelOf(t)}</option>)}</Select>
      <Select label="Priority" value={f.values.priority} onChange={f.onChange('priority')}>{NOTIFICATION_PRIORITIES.map(t => <option key={t} value={t}>{labelOf(t)}</option>)}</Select>
      <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>Send</Button></div>
    </form></Modal>);
}
