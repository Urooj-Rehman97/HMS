import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Mail, Plus, Printer, RefreshCw, Trash2, Wallet } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import { Input, Select, Textarea } from '../../components/Field';
import { Button, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { billingApi, paymentApi, publicApi } from '../../services';
import { CHARGE_TYPES, labelOf } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { nameOf } from '../../utils/entity';
import { intRange, maxLen, moneyRule, required } from '../../utils/validators';
/** Printable invoice. Staff: GET /billing/:id (+ charges, payments). Guest: GET /my/bills/:id (read-only). */
export default function Invoice() {
    const { id = '' } = useParams();
    const { user } = useAuth();
    const toast = useToast();
    const guest = user?.role === 'guest';
    const bill = useFetch(() => (guest ? billingApi.mineOne(id) : billingApi.get(id)), [id, guest]);
    const pays = useFetch(async () => (await paymentApi.forBill(id)).payments, [id], !guest);
    const hotel = useFetch(() => publicApi.hotel(), []);
    const [dlg, setDlg] = useState(null);
    const [busy, setBusy] = useState(false);
    const b = bill.data;
    if (bill.error)
        return <><PageHeader back="/portal/billing" title="Invoice"/><ErrorState onRetry={bill.reload} message={bill.error}/></>;
    if (bill.loading || !b)
        return <><PageHeader back="/portal/billing" title="Invoice"/><Skeleton className="h-96"/></>;
    const reload = () => { bill.reload(); pays.reload(); };
    const act = async (fn, ok) => { setBusy(true); try {
        await fn();
        toast.success(ok);
        reload();
    }
    catch (e) {
        toast.error(e.message);
    }
    finally {
        setBusy(false);
    } };
    const editable = !guest && b.status !== 'CANCELLED';
    const mail = `mailto:${b.guest?.email ?? ''}?subject=${encodeURIComponent(`Your invoice ${b.invoiceNumber}`)}&body=${encodeURIComponent(`Dear ${nameOf(b.guest)},\n\nInvoice ${b.invoiceNumber}\nTotal: ${formatCurrency(b.totalAmount, 2)}\nPaid: ${formatCurrency(b.paidAmount, 2)}\nBalance due: ${formatCurrency(b.balanceDue, 2)}\n\nThank you for staying with us.`)}`;
    return (<>
      <div className="no-print"><PageHeader back="/portal/billing" title={b.invoiceNumber} sub={`Issued ${formatDate(b.issuedAt ?? b.createdAt)}`} actions={<><StatusBadge status={b.status}/><Button variant="glass" onClick={() => window.print()}><Printer size={16}/> Print / PDF</Button>{!guest && b.guest?.email && <a className="btn-glass" href={mail}><Mail size={16}/> Email</a>}{editable && <Link to={`/portal/billing/${b._id}/payment`} className="btn-gold"><Wallet size={16}/> Record payment</Link>}</>}/></div>

      <article id="invoice" className="glass rounded-2xl p-6 md:p-10 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-wash/10 pb-6">
          <div><p className="font-serif text-3xl">{hotel.data?.hotelName || 'LuxuryStay'}</p><p className="mt-1 text-xs text-muted">{[hotel.data?.address, hotel.data?.city, hotel.data?.country].filter(Boolean).join(', ')}</p><p className="text-xs text-muted">{[hotel.data?.phone, hotel.data?.email].filter(Boolean).join(' · ')}</p></div>
          <div className="text-right text-sm"><p className="eyebrow">Invoice</p><p className="font-serif text-2xl">{b.invoiceNumber}</p>{b.dueDate && <p className="text-xs text-muted">Due {formatDate(b.dueDate)}</p>}</div>
        </header>
        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div><p className="eyebrow mb-1">Billed to</p><p className="font-medium">{nameOf(b.guest)}</p><p className="text-sm text-mist">{b.guest?.email}</p><p className="text-sm text-mist">{b.guest?.phone}</p></div>
          <div className="sm:text-right"><p className="eyebrow mb-1">Stay</p><p className="text-sm">{b.reservation?.bookingId}</p>{b.reservation?.checkInDate && <p className="text-sm text-mist">{formatDate(b.reservation.checkInDate)} → {formatDate(b.reservation.checkOutDate)}</p>}</div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead><tr className="border-b border-wash/10 text-left text-xs uppercase tracking-wider text-muted"><th className="py-2 pr-3">Description</th><th className="px-3">Type</th><th className="px-3 text-right">Qty</th><th className="px-3 text-right">Unit</th><th className="py-2 pl-3 text-right">Total</th>{editable && <th className="no-print w-8"/>}</tr></thead>
          <tbody>{(b.charges ?? []).map((c) => (<tr key={c._id} className="border-b border-wash/[0.06]"><td className="py-2.5 pr-3">{c.description}</td><td className="px-3 text-mist">{labelOf(c.type)}</td><td className="px-3 text-right">{c.quantity}</td><td className="px-3 text-right">{formatCurrency(c.unitPrice, 2)}</td><td className="py-2.5 pl-3 text-right">{formatCurrency(c.total, 2)}</td>{editable && <td className="no-print"><button aria-label={`Remove ${c.description}`} className="p-1 text-muted hover:text-red-500" disabled={busy} onClick={() => act(() => billingApi.removeCharge(b._id, c._id), 'Charge removed')}><Trash2 size={14}/></button></td>}</tr>))}</tbody></table></div>
        <dl className="ml-auto mt-6 w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-mist"><dt>Subtotal</dt><dd>{formatCurrency(b.subtotal, 2)}</dd></div><div className="flex justify-between text-mist"><dt>Tax & service</dt><dd>{formatCurrency(b.tax, 2)}</dd></div>
          {Number(b.discount) > 0 && <div className="flex justify-between text-mist"><dt>Discount</dt><dd>−{formatCurrency(b.discount, 2)}</dd></div>}
          <div className="flex justify-between border-t border-wash/10 pt-2 font-serif text-xl"><dt>Total</dt><dd>{formatCurrency(b.totalAmount, 2)}</dd></div>
          <div className="flex justify-between text-mist"><dt>Paid</dt><dd>{formatCurrency(b.paidAmount, 2)}</dd></div>
          {Number(b.refundedAmount) > 0 && <div className="flex justify-between text-mist"><dt>Refunded</dt><dd>{formatCurrency(b.refundedAmount, 2)}</dd></div>}
          <div className="flex justify-between font-medium text-gold-ink"><dt>Balance due</dt><dd>{formatCurrency(b.balanceDue, 2)}</dd></div>
        </dl>
        {b.notes && <p className="mt-6 whitespace-pre-wrap border-t border-wash/10 pt-4 text-xs text-muted">{b.notes}</p>}
      </article>

      {editable && <div className="no-print mt-4 flex flex-wrap gap-2"><Button variant="glass" onClick={() => setDlg('charge')}><Plus size={16}/> Add charge</Button><Button variant="glass" onClick={() => setDlg('edit')}>Edit tax / discount</Button><Button variant="glass" loading={busy} onClick={() => act(() => billingApi.refresh(b._id), 'Bill refreshed')}><RefreshCw size={16}/> Refresh status</Button></div>}

      {!guest && <section className="glass no-print mt-6 rounded-2xl p-5 md:p-6"><h2 className="mb-4 font-serif text-xl">Payments</h2>
        {pays.loading ? <Skeleton className="h-16"/> : !pays.data?.length ? <p className="text-sm text-mist">No payments recorded yet.</p> : <ul className="divide-y divide-wash/10">{pays.data.map((p) => <li key={p._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span><span className="font-medium">{p.transactionId}</span> <span className="text-xs text-muted">· {labelOf(p.method)} · {formatDateTime(p.paidAt ?? p.createdAt)}</span></span><span className={p.type === 'REFUND' ? 'text-red-500' : ''}>{p.type === 'REFUND' ? '−' : ''}{formatCurrency(p.amount, 2)} <StatusBadge status={p.status}/></span></li>)}</ul>}</section>}

      <ChargeDialog open={dlg === 'charge'} onClose={() => setDlg(null)} onSave={c => act(() => billingApi.addCharge(b._id, c), 'Charge added').then(() => setDlg(null))}/>
      <EditDialog open={dlg === 'edit'} bill={b} onClose={() => setDlg(null)} onSave={x => act(() => billingApi.update(b._id, x), 'Bill updated').then(() => setDlg(null))}/>
    </>);
}
function ChargeDialog({ open, onClose, onSave }) {
    const f = useForm({ type: 'SERVICE', description: '', quantity: '1', unitPrice: '' }, v => ({ type: required(v.type, 'Type'), description: required(v.description, 'Description') || maxLen(v.description, 200, 'Description'), quantity: intRange(v.quantity, 1, 1000, 'Quantity'), unitPrice: moneyRule(v.unitPrice, 'Unit price', 0) }));
    useEffect(() => { if (open)
        f.reset(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (e) => { e.preventDefault(); f.submit(async (v) => onSave({ type: v.type, description: v.description.trim(), quantity: Number(v.quantity), unitPrice: Number(v.unitPrice) })); };
    return (<Modal open={open} onClose={onClose} title="Add charge"><form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2">
      {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
      <Select label="Type" value={f.values.type} onChange={f.onChange('type')}>{CHARGE_TYPES.map(t => <option key={t} value={t}>{labelOf(t)}</option>)}</Select>
      <Input label="Quantity" type="number" min={1} value={f.values.quantity} onChange={f.onChange('quantity')} error={f.errors.quantity}/>
      <div className="sm:col-span-2"><Input label="Description" required maxLength={200} value={f.values.description} onChange={f.onChange('description')} onBlur={f.onBlur('description')} error={f.errors.description}/></div>
      <Input label="Unit price" type="number" min={0} step="any" required value={f.values.unitPrice} onChange={f.onChange('unitPrice')} onBlur={f.onBlur('unitPrice')} error={f.errors.unitPrice}/>
      <div className="flex items-end justify-end gap-3"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>Add charge</Button></div>
    </form></Modal>);
}
function EditDialog({ open, bill, onClose, onSave }) {
    const init = () => ({ tax: String(bill.tax ?? 0), discount: String(bill.discount ?? 0), notes: bill.notes ?? '' });
    const f = useForm(init(), v => ({ tax: moneyRule(v.tax, 'Tax', 0), discount: moneyRule(v.discount, 'Discount', 0), notes: maxLen(v.notes, 500, 'Notes') }));
    useEffect(() => { if (open)
        f.reset(init()); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
    const go = (e) => { e.preventDefault(); f.submit(async (v) => onSave({ tax: Number(v.tax), discount: Number(v.discount), notes: v.notes.trim() })); };
    return (<Modal open={open} onClose={onClose} title="Edit tax & discount"><form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2"><Input label="Tax & service" type="number" min={0} step="any" value={f.values.tax} onChange={f.onChange('tax')} error={f.errors.tax}/><Input label="Discount" type="number" min={0} step="any" value={f.values.discount} onChange={f.onChange('discount')} error={f.errors.discount}/><div className="sm:col-span-2"><Textarea label="Notes" rows={2} value={f.values.notes} onChange={f.onChange('notes')} error={f.errors.notes}/></div><div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>Save</Button></div></form></Modal>);
}
