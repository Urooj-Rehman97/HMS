import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Receipt } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { Chips, FilterSelect, Toolbar } from '../../components/common/Toolbar';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import { Input, Select, Textarea } from '../../components/Field';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch, useList } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { billingApi, paymentApi, reservationApi } from '../../services';
import { BILL_STATUSES, PAYMENT_METHODS, labelOf } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { nameOf } from '../../utils/entity';
import { maxLen, moneyRule } from '../../utils/validators';
/** Staff: GET /billing and GET /payments (note: the server path is /billing). Guest: GET /my/bills. */
export default function Bills() { const { user } = useAuth(); return user?.role === 'guest' ? <MyBills /> : <StaffBilling />; }
function MyBills() {
    const { data, loading, error, reload } = useFetch(() => billingApi.mine(), []);
    return (<>
      <PageHeader title="My invoices" sub="Charges and payments for your stays."/>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading ? <Skeleton className="h-40"/> : !data?.length ? <div className="glass rounded-2xl"><EmptyState title="No invoices yet" text="Your invoice appears here after check-out."/></div> : (<div className="grid gap-4 md:grid-cols-2">{data.map(b => (<Link key={b._id} to={`/portal/billing/${b._id}`} className="glass block rounded-2xl p-5 transition hover:border-gold">
            <div className="flex items-start justify-between"><div><p className="font-serif text-xl">{b.invoiceNumber}</p><p className="text-xs text-muted">{b.reservation?.bookingId} · {formatDate(b.issuedAt ?? b.createdAt)}</p></div><StatusBadge status={b.status}/></div>
            <div className="mt-4 flex justify-between text-sm"><span className="text-mist">Total</span><span>{formatCurrency(b.totalAmount)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-mist">Balance due</span><span className="text-gold-ink">{formatCurrency(b.balanceDue)}</span></div>
          </Link>))}</div>)}
    </>);
}
function StaffBilling() {
    const nav = useNavigate();
    const [tab, setTab] = useState('Bills');
    const [status, setStatus] = useState('All');
    const [method, setMethod] = useState('All');
    const [create, setCreate] = useState(false);
    const bills = useList(p => billingApi.list({ page: p, limit: 10, status }), [status]);
    const pays = useList(p => paymentApi.list({ page: p, limit: 10, method }), [method]);
    const bcols = [
        { key: 'i', head: 'Invoice', render: b => <span className="font-medium">{b.invoiceNumber}</span> }, { key: 'g', head: 'Guest', render: b => nameOf(b.guest) }, { key: 'r', head: 'Booking', hideMobile: true, render: b => b.reservation?.bookingId ?? '—' },
        { key: 't', head: 'Total', render: b => formatCurrency(b.totalAmount) }, { key: 'p', head: 'Paid', hideMobile: true, render: b => formatCurrency(b.paidAmount) }, { key: 'd', head: 'Balance', render: b => formatCurrency(b.balanceDue) }, { key: 's', head: 'Status', render: b => <StatusBadge status={b.status}/> },
    ];
    const pcols = [
        { key: 't', head: 'Transaction', render: p => <span className="font-medium">{p.transactionId}</span> }, { key: 'g', head: 'Guest', render: p => nameOf(p.guest) }, { key: 'm', head: 'Method', render: p => labelOf(p.method) },
        { key: 'ty', head: 'Type', hideMobile: true, render: p => labelOf(p.type) }, { key: 'a', head: 'Amount', render: p => <span className={p.type === 'REFUND' ? 'text-red-500' : ''}>{p.type === 'REFUND' ? '−' : ''}{formatCurrency(p.amount, 2)}</span> },
        { key: 'd', head: 'Date', hideMobile: true, render: p => formatDateTime(p.paidAt ?? p.createdAt) }, { key: 's', head: 'Status', render: p => <StatusBadge status={p.status}/> },
    ];
    return (<>
      <PageHeader title="Billing" sub="Invoices, charges and payments." actions={<Button onClick={() => setCreate(true)}><Plus size={16}/> Create bill</Button>}/>
      <Toolbar><Chips value={tab} onChange={setTab} options={['Bills', 'Payments']}/>{tab === 'Bills' ? <FilterSelect label="Statuses" value={status} onChange={setStatus} options={BILL_STATUSES}/> : <FilterSelect label="Methods" value={method} onChange={setMethod} options={PAYMENT_METHODS}/>}</Toolbar>
      <div className="glass overflow-hidden rounded-2xl">
        {tab === 'Bills' ? <Table cols={bcols} rows={bills.items} loading={bills.loading} error={bills.error} onRetry={bills.reload} onRow={b => nav(`/portal/billing/${b._id}`)} pager={{ page: bills.page, pages: bills.pages, total: bills.total, onPage: bills.setPage }} emptyTitle="No bills" emptyText="Create a bill from a checked-in or checked-out reservation."/>
            : <Table cols={pcols} rows={pays.items} loading={pays.loading} error={pays.error} onRetry={pays.reload} onRow={p => p.bill && nav(`/portal/billing/${p.bill?._id ?? p.bill}`)} pager={{ page: pays.page, pages: pays.pages, total: pays.total, onPage: pays.setPage }} emptyTitle="No payments recorded"/>}
      </div>
      <CreateBill open={create} onClose={() => setCreate(false)} onCreated={b => nav(`/portal/billing/${b._id}`)}/>
    </>);
}
/** POST /billing - one bill per reservation (the server answers 409 if a bill already exists). */
function CreateBill({ open, onClose, onCreated }) {
    const toast = useToast();
    const res = useFetch(async () => { const [a, b] = await Promise.all([reservationApi.list({ status: 'CHECKED_IN', limit: 100 }), reservationApi.list({ status: 'CHECKED_OUT', limit: 100 })]); return [...a.items, ...b.items]; }, [open], open);
    const f = useForm({ reservation: '', tax: '', discount: '', notes: '' }, v => ({ reservation: v.reservation ? '' : 'Choose a reservation', tax: moneyRule(v.tax, 'Tax', 0, false), discount: moneyRule(v.discount, 'Discount', 0, false), notes: maxLen(v.notes, 500, 'Notes') }));
    useEffect(() => { if (open)
        f.reset(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
    const pick = (id) => { f.set('reservation', id); const r = res.data?.find(x => x._id === id); if (r) {
        f.set('tax', String(r.tax ?? 0));
        f.set('discount', String(r.discount ?? 0));
    } };
    const go = (e) => { e.preventDefault(); f.submit(async (v) => { const b = await billingApi.create({ reservation: v.reservation, tax: v.tax === '' ? undefined : Number(v.tax), discount: v.discount === '' ? undefined : Number(v.discount), notes: v.notes.trim() || undefined }); toast.success('Bill created'); onClose(); onCreated(b); }); };
    return (<Modal open={open} onClose={onClose} title="Create bill">
      <form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2">
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        {res.error && <div className="sm:col-span-2"><Alert kind="error">{res.error}</Alert></div>}
        <div className="sm:col-span-2"><Select label="Reservation" required value={f.values.reservation} onChange={e => pick(e.target.value)} error={f.errors.reservation} hint={res.loading ? 'Loading…' : 'Only checked-in and checked-out stays can be billed.'}><option value="">Select…</option>{res.data?.map(r => <option key={r._id} value={r._id}>{r.bookingId} — {nameOf(r.guest)} ({labelOf(r.status)})</option>)}</Select></div>
        <Input label="Tax & service" type="number" min={0} step="any" value={f.values.tax} onChange={f.onChange('tax')} error={f.errors.tax}/>
        <Input label="Discount" type="number" min={0} step="any" value={f.values.discount} onChange={f.onChange('discount')} error={f.errors.discount}/>
        <div className="sm:col-span-2"><Textarea label="Notes" rows={2} value={f.values.notes} onChange={f.onChange('notes')} error={f.errors.notes}/></div>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}><Receipt size={16}/> Create bill</Button></div>
      </form>
    </Modal>);
}
