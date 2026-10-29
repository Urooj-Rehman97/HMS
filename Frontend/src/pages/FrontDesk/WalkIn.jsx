import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import ReservationForm from '../../components/reservations/ReservationForm';
import { CheckInModal } from '../../components/frontdesk/DeskModals';
import { useToast } from '../../components/common/Toast';
import { reservationApi } from '../../services';
/** Walk-in = book for today (bookingSource WALK_IN), confirm immediately, then open the check-in form. */
export default function WalkIn() {
    const nav = useNavigate();
    const toast = useToast();
    const [r, setR] = useState(null);
    return (<>
      <PageHeader title="Walk-in guest" sub="Create a same-day booking and check the guest in straight away."/>
      <ReservationForm source="WALK_IN" onCreated={async (created) => {
            try {
                await reservationApi.confirm(created._id);
                setR({ ...(await reservationApi.get(created._id)) });
            }
            catch (e) {
                toast.error(`Booking saved, but it could not be confirmed: ${e.message}`);
                nav(`/portal/reservations/${created._id}`);
            }
        }}/>
      <CheckInModal r={r} onClose={() => r && nav(`/portal/reservations/${r._id}`)} onDone={() => r && nav(`/portal/reservations/${r._id}`)}/>
    </>);
}
