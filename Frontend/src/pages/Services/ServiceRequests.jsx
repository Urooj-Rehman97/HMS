import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { FilterSelect, Toolbar } from '../../components/common/Toolbar';
import RequestServiceModal from '../../components/services/RequestServiceModal';
import { Button, StatusBadge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useList } from '../../hooks/useFetch';
import { serviceApi } from '../../services';
import { SERVICE_REQUEST_STATUSES } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { nameOf, roomNo } from '../../utils/entity';
/** GET /services/requests (the server scopes it: guests see only their own). */
export default function ServiceRequests() {
    const { user } = useAuth();
    const nav = useNavigate();
    const guest = user?.role === 'guest';
    const [status, setStatus] = useState('All');
    const [open, setOpen] = useState(false);
    const list = useList(page => serviceApi.requests.list({ page, limit: 10, status }), [status]);
    const cols = [
        { key: 's', head: 'Service', render: r => <span className="font-medium">{r.service?.name ?? '—'}</span> }, { key: 'q', head: 'Qty', hideMobile: true, render: r => r.quantity },
        ...(guest ? [] : [{ key: 'g', head: 'Guest', render: (r) => nameOf(r.guest) }, { key: 'r', head: 'Room', hideMobile: true, render: (r) => roomNo(r.room) }]),
        { key: 't', head: 'Total', hideMobile: true, render: r => formatCurrency(r.totalAmount, 2) }, { key: 'd', head: 'Requested', hideMobile: true, render: r => formatDateTime(r.createdAt) }, { key: 'st', head: 'Status', render: r => <StatusBadge status={r.status}/> },
    ];
    return (<>
      <PageHeader back="/portal/services" title={guest ? 'My service requests' : 'Service requests'} sub={guest ? 'Track what you have asked for.' : 'Confirm, assign and complete guest requests.'} actions={guest && <Button onClick={() => setOpen(true)}>New request</Button>}/>
      <Toolbar><FilterSelect label="Statuses" value={status} onChange={setStatus} options={SERVICE_REQUEST_STATUSES}/></Toolbar>
      <div className="glass overflow-hidden rounded-2xl"><Table cols={cols} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} onRow={r => nav(`/portal/services/requests/${r._id}`)} pager={{ page: list.page, pages: list.pages, total: list.total, onPage: list.setPage }} emptyTitle="No service requests"/></div>
      <RequestServiceModal open={open} onClose={() => setOpen(false)} onDone={list.reload}/>
    </>);
}
