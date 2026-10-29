import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import ReservationForm from '../../components/reservations/ReservationForm';
/** /portal/reservations/new - staff books a room for a guest profile (POST /reservations). */
export default function NewReservation() {
    const nav = useNavigate();
    return (<><PageHeader back="/portal/reservations" title="New reservation" sub="Choose a guest, dates and a room. Availability is checked live."/><ReservationForm onCreated={r => nav(`/portal/reservations/${r._id}`)}/></>);
}
