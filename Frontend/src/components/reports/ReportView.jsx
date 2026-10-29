
/**
 * Generic report renderer.
 * Numbers → stat tiles, nested objects → panels, arrays → tables.
 */
import { useMemo } from 'react';
import { Download } from 'lucide-react';
import PageHeader from '../common/PageHeader';
import StatCard from '../common/StatCard';
import { Panel } from '../common/Detail';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '../ui';
import { useDateRange } from '../common/DateRange';
import { useFetch } from '../../hooks/useFetch';
import { reportApi } from '../../services';
import { downloadCsv } from '../../utils/entity';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export const humanize = (key) =>
    String(key)
        .replace(/^_id$/, 'name')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/^./, (char) => char.toUpperCase());

const MONEY =
    /(revenue|amount|paid|balance|outstanding|subtotal|tax|discount|refund|price|spent|cost|total(?!(Rooms|Reservations|Guests|Reviews|Payments|Nights|Stays|Bookings|Requests|Tasks|Count))|income)/i;

const PCT = /(rate|percentage|percent)$/i;
const ISO = /^\d{4}-\d{2}-\d{2}T/;

const isObj = (value) =>
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);

const safeText = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (Array.isArray(value)) {
        return value.map(safeText).filter(Boolean).join(', ');
    }
    if (isObj(value)) {
        // Handle common MongoDB references without converting the
        // complete object to a primitive string.
        const id = value._id ?? value.id;
        const name =
            value.name ??
            value.fullName ??
            value.roomNumber ??
            value.email;

        if (name !== undefined && name !== null) {
            return safeText(name);
        }

        if (id !== undefined && id !== null) {
            return safeText(id);
        }

        return '';
    }
    return '';
};

export function fmt(key, value) {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
        if (PCT.test(key)) return `${value.toFixed(1)}%`;
        if (MONEY.test(key)) return formatCurrency(value);

        return Number.isInteger(value)
            ? value.toLocaleString()
            : value.toFixed(2);
    }

    if (typeof value === 'string') {
        if (ISO.test(value)) return formatDate(value);

        if (/^[A-Z_]{3,}$/.test(value)) {
            return <StatusBadge status={value} />;
        }

        return value;
    }

    if (Array.isArray(value)) {
        return value.map(safeText).filter(Boolean).join(', ') || '—';
    }

    if (isObj(value)) {
        const text = Object.entries(value)
            .map(([keyName, item]) => {
                const result = safeText(item);
                return result ? `${humanize(keyName)}: ${result}` : '';
            })
            .filter(Boolean)
            .join(' · ');

        return text || '—';
    }

    return '—';
}

/** Flatten nested objects into CSV/table-friendly values. */
const flat = (row) => {
    if (!isObj(row)) {
        return { value: safeText(row) };
    }

    const result = {};

    Object.entries(row).forEach(([key, value]) => {
        if (isObj(value)) {
            result[key] = Object.entries(value)
                .map(([nestedKey, nestedValue]) => {
                    const text = safeText(nestedValue);
                    return text ? `${nestedKey}: ${text}` : '';
                })
                .filter(Boolean)
                .join(' / ');
        } else if (Array.isArray(value)) {
            result[key] = value.map(safeText).filter(Boolean).join(', ');
        } else {
            result[key] = safeText(value);
        }
    });

    return result;
};

export function ReportBody({ data }) {
    if (!isObj(data)) {
        return (
            <div className="glass rounded-2xl">
                <EmptyState
                    title="No data"
                    text="The report returned an unexpected data format."
                />
            </div>
        );
    }

    const scalars = Object.entries(data).filter(
        ([, value]) =>
            value !== null &&
            ['number', 'string', 'boolean'].includes(typeof value)
    );

    const groups = Object.entries(data).filter(([, value]) =>
        isObj(value)
    );

    const tables = Object.entries(data).filter(([, value]) =>
        Array.isArray(value)
    );

    const empty =
        !scalars.length &&
        !groups.length &&
        !tables.some(([, rows]) => rows.length > 0);

    if (empty) {
        return (
            <div className="glass rounded-2xl">
                <EmptyState
                    title="No data"
                    text="There is nothing to report for this period."
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {scalars.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {scalars.map(([key, value]) => (
                        <StatCard
                            key={key}
                            label={humanize(key)}
                            value={fmt(key, value)}
                        />
                    ))}
                </div>
            )}

            {groups.map(([groupKey, group]) => {
                const items = Object.entries(group).filter(
                    ([, value]) =>
                        value === null ||
                        ['string', 'number', 'boolean'].includes(typeof value)
                );

                return items.length ? (
                    <Panel
                        key={groupKey}
                        title={humanize(groupKey)}
                    >
                        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {items.map(([key, value]) => (
                                <div key={key}>
                                    <dt className="text-[11px] uppercase tracking-wider text-muted">
                                        {humanize(key)}
                                    </dt>
                                    <dd className="mt-1 font-serif text-2xl">
                                        {fmt(key, value)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Panel>
                ) : null;
            })}

            {tables.map(([tableKey, rows]) =>
                rows.length === 0 ? null : (
                    <TablePanel
                        key={tableKey}
                        title={humanize(tableKey)}
                        rows={rows.map(flat)}
                    />
                )
            )}
        </div>
    );
}

function TablePanel({ title, rows }) {
    const cols = useMemo(
        () =>
            Object.keys(rows[0] || {})
                .filter((key) => !/^(__v|password)/i.test(key))
                .slice(0, 8),
        [rows]
    );

    return (
        <Panel
            title={title}
            actions={
                <Button
                    variant="glass"
                    className="!px-3 !py-1.5 text-xs"
                    onClick={() =>
                        downloadCsv(
                            title.toLowerCase().replace(/\s+/g, '-'),
                            rows
                        )
                    }
                >
                    <Download size={14} />
                    CSV
                </Button>
            }
        >
            <div className="-mx-2 overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                    <thead>
                        <tr className="border-b border-wash/10 text-left text-xs uppercase tracking-wider text-muted">
                            {cols.map((column) => (
                                <th
                                    key={column}
                                    className="px-2 py-2"
                                >
                                    {humanize(column)}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.slice(0, 50).map((row, index) => (
                            <tr
                                key={index}
                                className="border-b border-wash/[0.06]"
                            >
                                {cols.map((column) => (
                                    <td
                                        key={column}
                                        className="px-2 py-2"
                                    >
                                        {safeText(row[column]) || '—'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {rows.length > 50 && (
                <p className="mt-2 text-xs text-muted">
                    Showing the first 50 of {rows.length} rows.
                    Download the CSV for everything.
                </p>
            )}
        </Panel>
    );
}

/** Page frame: title, date range, loading/error handling and optional charts. */
export function ReportShell({
    kind,
    title,
    sub,
    back,
    dated = true,
    top,
}) {
    const { range, control } = useDateRange('30');

    const { data, loading, error, reload } = useFetch(
        () => reportApi.get(kind, dated ? range : {}),
        [kind, range.startDate, range.endDate, dated]
    );

    return (
        <>
            <PageHeader
                back={back}
                title={title}
                sub={sub}
                actions={dated ? control : undefined}
            />

            {error ? (
                <ErrorState onRetry={reload} message={error} />
            ) : loading || !data ? (
                <div className="space-y-4">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-64" />
                </div>
            ) : (
                <div className="space-y-6">
                    {top?.(data)}
                    <ReportBody data={data} />
                </div>
            )}
        </>
    );
}
