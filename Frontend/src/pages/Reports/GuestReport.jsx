import { ReportShell } from '../../components/reports/ReportView';
/** GET /reports/guests - guest counts, new guests and top guests. */
export default function GuestReport() {
    return <ReportShell kind="guests" back="/portal/reports" title="Guest report" sub="Who stayed, how often and how much they spent."/>;
}
