import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import { Input, Select, Textarea } from '../../components/Field';
import { Button, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { Panel } from '../../components/common/Detail';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { billingApi, paymentApi } from '../../services';
import { PAYMENT_METHODS, labelOf } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { nameOf } from '../../utils/entity';
import { ADMIN_MGR, can } from '../../utils/permissions';
import { maxLen } from '../../utils/validators';
/** POST /payments (record a payment) and POST /payments/:id/refund (Admin/Manager). */
export default function Payment() {
    const { id = '' } = useParams();
    const nav = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    const bill = useFetch(() => billingApi.get(id), [id]);
    const pays = useFetch(async () => (await paymentApi.forBill(id)).payments, [id]);
    const [refund, setRefund] = useState(null);
    const b = bill.data;
    const due = Number(b?.balanceDue ?? 0);
    const f = useForm({ method: 'CASH', amount: '', transactionReference: '', gateway: '', notes: '' }, v => {
        const n = Number(v.amount);
        return { amount: v.amount === '' ? 'Amount is required' : !Number.isFinite(n) || n < 0.01 ? 'Enter at least 0.01' : n > due + 0.0001 ? `Amount cannot exceed the balance due (${formatCurrency(due, 2)})` : '',
            transactionReference: v.transactionReference && !/^[A-Za-z0-9][A-Za-z0-9\s/_-]{2,59}$/.test(v.transactionReference.trim()) ? 'Use 3-60 letters, numbers, spaces, - or /' : v.method !== 'CASH' && !v.transactionReference.trim() ? 'A reference is required for non-cash payments' : '', gateway: maxLen(v.gateway, 60, 'Gateway'), notes: maxLen(v.notes, 500, 'Notes') };
    });
    if (bill.error)
        return <><PageHeader back={`/portal/billing/${id}`} title="Record payment"/><ErrorState onRetry={bill.reload} message={bill.error}/></>;
    if (bill.loading || !b)
        return <><PageHeader back={`/portal/billing/${id}`} title="Record payment"/><Skeleton className="h-72"/></>;
    const go = (e) => { e.preventDefault(); f.submit(async (v) => { await paymentApi.create({ bill: b._id, method: v.method, amount: Number(v.amount), transactionReference: v.transactionReference.trim() || undefined, gateway: v.gateway.trim() || undefined, notes: v.notes.trim() || undefined }); toast.success('Payment recorded'); nav(`/portal/billing/${b._id}`); }); };
    return (<>
      <PageHeader back={`/portal/billing/${b._id}`} title="Record payment" sub={`${b.invoiceNumber} · ${nameOf(b.guest)}`} actions={<StatusBadge status={b.status}/>}/>
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={go} noValidate className="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-2 lg:col-span-2">
          {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
          {due <= 0 && <div className="sm:col-span-2"><Alert kind="info">This bill has no balance due.</Alert></div>}
          <Select label="Method" value={f.values.method} onChange={f.onChange('method')}>{PAYMENT_METHODS.map(m => <option key={m} value={m}>{labelOf(m)}</option>)}</Select>
          <div><Input label="Amount" type="number" min={0.01} step="any" required value={f.values.amount} onChange={f.onChange('amount')} onBlur={f.onBlur('amount')} error={f.errors.amount}/>{due > 0 && <button type="button" className="mt-1 text-xs text-gold-ink hover:underline" onClick={() => f.set('amount', String(due))}>Pay full balance ({formatCurrency(due, 2)})</button>}</div>
          <Input label="Reference / transaction ID" value={f.values.transactionReference} onChange={f.onChange('transactionReference')} onBlur={f.onBlur('transactionReference')} error={f.errors.transactionReference}/>
          <Input label="Gateway (optional)" value={f.values.gateway} onChange={f.onChange('gateway')} error={f.errors.gateway}/>
          <div className="sm:col-span-2"><Textarea label="Notes" rows={2} value={f.values.notes} onChange={f.onChange('notes')} error={f.errors.notes}/></div>
          <div className="sm:col-span-2"><Button type="submit" loading={f.submitting} disabled={due <= 0}>Record payment</Button></div>
        </form>
        <div className="space-y-6">
          <Panel title="Balance"><dl className="space-y-1.5 text-sm"><div className="flex justify-between text-mist"><dt>Total</dt><dd>{formatCurrency(b.totalAmount, 2)}</dd></div><div className="flex justify-between text-mist"><dt>Paid</dt><dd>{formatCurrency(b.paidAmount, 2)}</dd></div><div className="flex justify-between font-serif text-xl text-gold-ink"><dt>Due</dt><dd>{formatCurrency(due, 2)}</dd></div></dl></Panel>
          <Panel title="History">{!pays.data?.length ? <p className="text-sm text-mist">No payments yet.</p> : <ul className="divide-y divide-wash/10">{pays.data.map((p) => <li key={p._id} className="py-2.5 text-sm"><div className="flex justify-between"><span>{labelOf(p.method)}</span><span className={p.type === 'REFUND' ? 'text-red-500' : ''}>{p.type === 'REFUND' ? '−' : ''}{formatCurrency(p.amount, 2)}</span></div><div className="flex items-center justify-between text-xs text-muted"><span>{formatDateTime(p.paidAt ?? p.createdAt)}</span>{p.type === 'PAYMENT' && p.status === 'COMPLETED' && can(user?.role, ...ADMIN_MGR) && <button className="text-red-500 hover:underline" onClick={() => setRefund(p)}>Refund</button>}</div></li>)}</ul>}</Panel>
        </div>
      </div>
      <RefundDialog p={refund} onClose={() => setRefund(null)} onDone={() => { pays.reload(); bill.reload(); }}/>
    </>);
}
function RefundDialog({ p, onClose, onDone }) {
    const toast = useToast();
    const max = Number(p?.amount ?? 0);
    const f = useForm({ amount: '', reason: '' }, v => { const n = Number(v.amount); return { amount: v.amount === '' ? 'Amount is required' : !(n >= 0.01) ? 'Enter at least 0.01' : n > max ? `Cannot exceed ${formatCurrency(max, 2)}` : '', reason: !v.reason.trim() ? 'A reason is required' : maxLen(v.reason, 300, 'Reason') }; });
    const go = (e) => { e.preventDefault(); f.submit(async (v) => { await paymentApi.refund(p._id, { amount: Number(v.amount), reason: v.reason.trim() }); toast.success('Refund recorded'); onDone(); onClose(); }); };
    return (<Modal open={!!p} onClose={onClose} title="Refund payment">{p && <form onSubmit={go} noValidate className="space-y-4">
      {f.formError && <Alert kind="error">{f.formError}</Alert>}
      <p className="text-sm text-mist">Original payment {p.transactionId}: {formatCurrency(p.amount, 2)}</p>
      <Input label="Refund amount" type="number" min={0.01} step="any" value={f.values.amount} onChange={f.onChange('amount')} error={f.errors.amount}/>
      <Textarea label="Reason" rows={2} value={f.values.reason} onChange={f.onChange('reason')} error={f.errors.reason}/>
      <div className="flex justify-end gap-3"><Button variant="glass" onClick={onClose}>Cancel</Button><Button variant="danger" type="submit" loading={f.submitting}>Refund</Button></div></form>}</Modal>);
}
