import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { FilterSelect, SearchBox, Toolbar } from '../../components/common/Toolbar';
import { StatusBadge } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';
import { useList } from '../../hooks/useFetch';
import { userApi } from '../../services';
import { SERVER_ROLE, ROLE_LABEL } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { nameOf } from '../../utils/entity';
const ROLES = Object.values(SERVER_ROLE);
/** GET /users?role&isActive&search&page&limit - every login account (guests and staff). */
export default function Users() {
    const nav = useNavigate();
    const [search, setSearch] = useState('');
    const q = useDebounce(search.trim(), 350);
    const [role, setRole] = useState('All');
    const [active, setActive] = useState('All');
    const list = useList(page => userApi.list({ page, limit: 10, search: q, role, isActive: active === 'All' ? undefined : active === 'Active' ? 'true' : 'false' }), [q, role, active]);
    const cols = [
        { key: 'name', head: 'Name', render: u => <span className="font-medium">{nameOf(u)}</span> },
        { key: 'email', head: 'Email', render: u => <span className="break-all">{u.email}</span> },
        { key: 'role', head: 'Role', render: u => ROLE_LABEL[String(u.role).toLowerCase()] ?? u.role },
        { key: 'phone', head: 'Phone', hideMobile: true, render: u => u.phone || '—' },
        { key: 'joined', head: 'Joined', hideMobile: true, render: u => formatDate(u.createdAt) },
        { key: 'st', head: 'Status', render: u => <StatusBadge status={u.isActive === false ? 'INACTIVE' : 'ACTIVE'}/> },
    ];
    return (<>
      <PageHeader title="User accounts" sub="Everyone who can sign in. Open an account to edit it or switch access on and off."/>
      <Toolbar><SearchBox value={search} onChange={setSearch} placeholder="Name or email…"/><FilterSelect label="Roles" value={role} onChange={setRole} options={ROLES}/><FilterSelect label="Status" value={active} onChange={setActive} options={['Active', 'Inactive']}/></Toolbar>
      <div className="glass overflow-hidden rounded-2xl"><Table cols={cols} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload} onRow={u => nav(`/portal/users/${u._id}`)} pager={{ page: list.page, pages: list.pages, total: list.total, onPage: list.setPage }} emptyTitle="No users found"/></div>
    </>);
}
