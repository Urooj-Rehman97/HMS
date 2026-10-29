import { useEffect, useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Stars from '../../components/common/Stars';
import StatCard from '../../components/common/StatCard';
import { Input, Select, Textarea } from '../../components/Field';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { FilterSelect, Toolbar } from '../../components/common/Toolbar';
import { Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useFetch, useList } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { feedbackApi, reservationApi } from '../../services';
import { FEEDBACK_STATUSES } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { nameOf, roomNo } from '../../utils/entity';
import { ADMIN_MGR, can } from '../../utils/permissions';
import { maxLen } from '../../utils/validators';
/** Guest: leave/edit feedback after check-out (POST /feedback, GET /feedback/my-feedback). Staff: review, respond, publish/hide (GET /feedback). */
export default function Feedback() { const { user } = useAuth(); return user?.role === 'guest' ? <GuestFeedback /> : <StaffFeedback />; }
function GuestFeedback() {
    const { data, loading, error, reload } = useFetch(() => feedbackApi.mine(), []);
    const stays = useFetch(async () => (await reservationApi.mine()).filter(r => r.status === 'CHECKED_OUT'), []);
    const [dlg, setDlg] = useState(undefined);
    const given = new Set((data ?? []).map(f => f.reservation?._id ?? f.reservation));
    const pending = (stays.data ?? []).filter(r => !given.has(r._id));
    return (<>
      <PageHeader title="My feedback" sub="Tell us how your stay went - it helps us improve." actions={pending.length > 0 && <Button onClick={() => setDlg(null)}><MessageSquarePlus size={16}/> Leave feedback</Button>}/>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading ? <Skeleton className="h-32"/> : !data?.length ? <div className="glass rounded-2xl"><EmptyState title="No feedback yet" text={pending.length ? 'You have a completed stay - we would love to hear about it.' : 'After check-out you can rate your stay here.'} action={pending.length ? <Button onClick={() => setDlg(null)}>Leave feedback</Button> : undefined}/></div> : (<div className="grid gap-4 md:grid-cols-2">{data.map(f => (<article key={f._id} className="glass rounded-2xl p-5"><div className="flex items-start justify-between gap-3"><div><Stars value={f.overallRating}/><h2 className="mt-2 font-serif text-xl">{f.title}</h2></div><StatusBadge status={f.status}/></div>
            {f.comment && <p className="mt-2 text-sm text-mist">{f.comment}</p>}
            {f.adminResponse && <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-3 text-sm"><p className="eyebrow mb-1">Reply from the hotel</p>{f.adminResponse}</div>}
            <div className="mt-4 flex items-center justify-between text-xs text-muted"><span>{formatDate(f.createdAt)}</span><button className="text-gold-ink hover:underline" onClick={() => setDlg(f)}>Edit</button></div></article>))}</div>)}
      <FeedbackForm open={dlg !== undefined} item={dlg} stays={pending} onClose={() => setDlg(undefined)} onSaved={reload}/>
    </>);
}
function FeedbackForm({ open, item, stays, onClose, onSaved }) {
    const toast = useToast();
    const init = () => ({ reservation: '', overallRating: item?.overallRating ?? 0, title: item?.title ?? '', comment: item?.comment ?? '' });
    const f = useForm(init(), v => ({ reservation: !item && !v.reservation ? 'Choose the stay' : '', overallRating: item || v.overallRating >= 1 ? '' : 'Please choose a rating', title: !v.title.trim() ? 'A short title is required' : maxLen(v.title, 150, 'Title'), comment: maxLen(v.comment, 3000, 'Comment') }));
    useEffect(() => { if (open) {
        const i = init();
        if (!item && stays.length === 1)
            i.reservation = stays[0]._id;
        f.reset(i);
    } }, [open, item?._id]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (e) => { e.preventDefault(); f.submit(async (v) => { item ? await feedbackApi.update(item._id, { title: v.title.trim(), comment: v.comment.trim() }) : await feedbackApi.create({ reservation: v.reservation, overallRating: v.overallRating, title: v.title.trim(), comment: v.comment.trim() || undefined }); toast.success('Thank you for your feedback!'); onSaved(); onClose(); }); };
    return (<Modal open={open} onClose={onClose} title={item ? 'Edit feedback' : 'Rate your stay'}>
      <form onSubmit={go} noValidate className="space-y-4">
        {f.formError && <Alert kind="error">{f.formError}</Alert>}
        {!item && <Select label="Stay" required value={f.values.reservation} onChange={f.onChange('reservation')} error={f.errors.reservation}><option value="">Select…</option>{stays.map(r => <option key={r._id} value={r._id}>{r.bookingId} · Room {roomNo(r.room)} · {formatDate(r.checkOutDate)}</option>)}</Select>}
        {!item && <div><span className="label">Overall rating</span><Stars value={f.values.overallRating} onChange={n => f.set('overallRating', n)}/>{f.errors.overallRating && <p role="alert" className="mt-1 text-xs text-red-500">{f.errors.overallRating}</p>}</div>}
        <Input label="Title" required maxLength={150} value={f.values.title} onChange={f.onChange('title')} onBlur={f.onBlur('title')} error={f.errors.title} placeholder="Summarise your stay"/>
        <Textarea label="Your comments" rows={4} maxLength={3000} value={f.values.comment} onChange={f.onChange('comment')} error={f.errors.comment}/>
        <div className="flex justify-end gap-3"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>{item ? 'Save' : 'Submit feedback'}</Button></div>
      </form>
    </Modal>);
}
function StaffFeedback() {
    const { user } = useAuth();
    const toast = useToast();
    const manage = can(user?.role, ...ADMIN_MGR);
    const [status, setStatus] = useState('All');
    const [rating, setRating] = useState('All');
    const list = useList(p => feedbackApi.list({ page: p, limit: 10, status, rating: rating === 'All' ? undefined : rating.charAt(0) }), [status, rating]);
    const sum = useFetch(() => feedbackApi.summary(), [], manage);
    const [reply, setReply] = useState(null);
    const [del, setDel] = useState(null);
    const setSt = async (f, s) => { try {
        await feedbackApi.setStatus(f._id, s);
        toast.success(`Feedback ${s.toLowerCase()}`);
        list.reload();
    }
    catch (e) {
        toast.error(e.message);
    } };
    return (<>
      <PageHeader title="Guest feedback" sub="What guests say about their stays."/>
      {manage && <div className="mb-6 grid gap-4 sm:grid-cols-3"><StatCard loading={sum.loading} icon={Star} label="Average rating" value={`${Number(sum.data?.averageRating ?? 0).toFixed(1)} / 5`}/><StatCard loading={sum.loading} label="Reviews" value={sum.data?.totalReviews ?? 0}/><StatCard loading={sum.loading} label="5-star reviews" value={sum.data?.fiveStar ?? 0}/></div>}
      <Toolbar><FilterSelect label="Statuses" value={status} onChange={setStatus} options={FEEDBACK_STATUSES}/><FilterSelect label="Ratings" value={rating} onChange={setRating} options={['5 stars', '4 stars', '3 stars', '2 stars', '1 star']}/></Toolbar>
      {list.error ? <ErrorState onRetry={list.reload} message={list.error}/> : list.loading ? <Skeleton className="h-40"/> : !list.items.length ? <div className="glass rounded-2xl"><EmptyState title="No feedback" text="Nothing matches these filters."/></div> : (<div className="space-y-4">{list.items.map(f => (<article key={f._id} className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><Stars value={f.overallRating}/><h2 className="mt-1 font-serif text-xl">{f.title}</h2><p className="text-xs text-muted">{nameOf(f.guest)} · Room {roomNo(f.room)} · {formatDate(f.createdAt)}</p></div><StatusBadge status={f.status}/></div>
            {f.comment && <p className="mt-3 text-sm text-mist">{f.comment}</p>}
            {f.adminResponse && <div className="mt-3 rounded-xl border border-gold/30 bg-gold/5 p-3 text-sm"><p className="eyebrow mb-1">Response · {f.respondedAt ? formatDateTime(f.respondedAt) : ''}</p>{f.adminResponse}</div>}
            {manage && <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" className="!py-1.5 text-xs" onClick={() => setReply(f)}>{f.adminResponse ? 'Edit response' : 'Respond'}</Button>{f.status !== 'PUBLISHED' && <Button variant="glass" className="!py-1.5 text-xs" onClick={() => setSt(f, 'PUBLISHED')}>Publish</Button>}{f.status !== 'HIDDEN' && <Button variant="glass" className="!py-1.5 text-xs" onClick={() => setSt(f, 'HIDDEN')}>Hide</Button>}<Button variant="danger" className="!py-1.5 text-xs" onClick={() => setDel(f)}>Delete</Button></div>}
          </article>))}
          {list.pages > 1 && <div className="flex items-center justify-center gap-3 pt-2 text-sm"><Button variant="glass" disabled={list.page <= 1} onClick={() => list.setPage(list.page - 1)}>Previous</Button><span className="text-mist">Page {list.page} of {list.pages}</span><Button variant="glass" disabled={list.page >= list.pages} onClick={() => list.setPage(list.page + 1)}>Next</Button></div>}</div>)}
      <ReplyDialog item={reply} onClose={() => setReply(null)} onSaved={list.reload}/>
      <ConfirmDialog open={!!del} danger title="Delete this feedback?" message="This permanently removes the review." confirmLabel="Delete" onClose={() => setDel(null)} onConfirm={async () => { try {
        await feedbackApi.remove(del._id);
        toast.success('Feedback deleted');
        list.reload();
    }
    catch (e) {
        toast.error(e.message);
        throw e;
    } }}/>
    </>);
}
function ReplyDialog({ item, onClose, onSaved }) {
    const toast = useToast();
    const f = useForm({ adminResponse: '' }, v => ({ adminResponse: !v.adminResponse.trim() ? 'Write a response' : maxLen(v.adminResponse, 2000, 'Response') }));
    useEffect(() => { if (item)
        f.reset({ adminResponse: item.adminResponse ?? '' }); }, [item?._id]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (e) => { e.preventDefault(); f.submit(async (v) => { await feedbackApi.respond(item._id, v.adminResponse.trim()); toast.success('Response saved'); onSaved(); onClose(); }); };
    return (<Modal open={!!item} onClose={onClose} title="Respond to guest"><form onSubmit={go} noValidate className="space-y-4">{f.formError && <Alert kind="error">{f.formError}</Alert>}<Textarea label="Your response" rows={4} maxLength={2000} value={f.values.adminResponse} onChange={f.onChange('adminResponse')} error={f.errors.adminResponse}/><div className="flex justify-end gap-3"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>Save response</Button></div></form></Modal>);
}
