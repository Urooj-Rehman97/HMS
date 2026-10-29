
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

import { Input, Select } from '../../components/Field';
import { Button, GlassCard } from '../../components/ui';
import { useFetch } from '../../hooks/useFetch';
import Alert from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';
import { roomApi } from '../../services/roomApi';
import { reservationApi } from '../../services/reservationApi';
import { guestApi } from '../../services/guestApi';
import { ApiError } from '../../services/api';
import {
  roomTypeName,
  uid,
  roomNo,
  pick,
} from '../../utils/entity';
import { formatCurrency } from '../../utils/formatCurrency';
import { todayISO } from '../../utils/formatDate';

const normalizeRooms = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.rooms)) return response.data.rooms;
  if (Array.isArray(response?.rooms)) return response.rooms;
  return [];
};

const getRoomStatusLabel = (status) => {
  const statuses = {
    AVAILABLE: 'Available',
    VACANT: 'Ready for guests',
    CLEANING: 'Currently cleaning',
    OCCUPIED: 'Currently occupied',
    MAINTENANCE: 'Under maintenance',
  };

  return statuses[String(status || '').toUpperCase()]
    || 'Status unavailable';
};

export default function Reserve() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [fail, setFail] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const {
    data: roomsData,
    loading: roomsLoading,
    error: roomsError,
    reload: reloadRooms,
  } = useFetch(() => roomApi.available(), []);

  const availableRooms = useMemo(
    () => normalizeRooms(roomsData),
    [roomsData]
  );

  const [form, setForm] = useState({
    first: user?.firstName ?? '',
    last: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    in: searchParams.get('in') ?? '',
    out: searchParams.get('out') ?? '',
    guests: searchParams.get('guests') ?? '2',
    roomId: searchParams.get('roomId') ?? '',
    notes: '',
  });

  useEffect(() => {
    document.title = 'Reserve — LuxuryStay';
  }, []);

  useEffect(() => {
    if (!availableRooms.length) return;

    setForm((previous) => {
      const selectedRoomExists = availableRooms.some(
        (room) => uid(room) === previous.roomId
      );

      if (selectedRoomExists) return previous;

      return {
        ...previous,
        roomId: uid(availableRooms[0]) || '',
      };
    });
  }, [availableRooms]);

  const room =
    availableRooms.find((item) => uid(item) === form.roomId)
    ?? availableRooms[0]
    ?? null;

  const roomName = room
    ? `${roomTypeName(room) || 'Room'} · ${roomNo(room)}`
    : 'No room selected';

  const rate = room
    ? Number(
        pick(
          room,
          'price',
          'pricePerNight',
          'roomType.basePrice',
          'roomType.price'
        ) ?? 0
      )
    : 0;

  const capacity = room
    ? Number(pick(room, 'capacity', 'roomType.capacity') ?? 1)
    : 1;

  const nights = useMemo(() => {
    if (!form.in || !form.out) return 0;

    const checkIn = new Date(`${form.in}T00:00:00`);
    const checkOut = new Date(`${form.out}T00:00:00`);

    const difference = checkOut.getTime() - checkIn.getTime();

    return difference > 0
      ? Math.round(difference / 86400000)
      : 0;
  }, [form.in, form.out]);

  const subtotal = nights * rate;
  const tax = Math.round(subtotal * 0.16);
  const total = subtotal + tax;

  const updateField = (field) => (event) => {
    const value = event.target.value;

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: '',
    }));

    setFail('');
  };

const submit = async (event) => {
  event.preventDefault();
  setFail('');

  const validationErrors = {};

  if (!form.first.trim()) {
    validationErrors.first = 'First name is required';
  }

  if (!form.last.trim()) {
    validationErrors.last = 'Last name is required';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    validationErrors.email = 'Enter a valid email';
  }

  if (form.phone.replace(/\D/g, '').length < 7) {
    validationErrors.phone = 'Enter a valid phone number';
  }

  if (!form.in) {
    validationErrors.in = 'Choose a check-in date';
  } else if (form.in < todayISO()) {
    validationErrors.in = 'Check-in cannot be in the past';
  }

  if (!form.out || form.out <= form.in) {
    validationErrors.out = 'Check-out must be after check-in';
  }

  if (!room) {
    validationErrors.roomId = 'No room is available to reserve';
  }

  const guestCount = Number(form.guests);

  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 6) {
    validationErrors.guests = 'Select between 1 and 6 guests';
  } else if (room && guestCount > capacity) {
    validationErrors.guests =
      `${roomName} accommodates up to ${capacity} guests`;
  }

  setErrors(validationErrors);

  if (Object.keys(validationErrors).length > 0) {
    return;
  }

  setBusy(true);

  try {
    // Recheck availability for the selected dates.
    const response = await roomApi.available({
      checkIn: form.in,
      checkOut: form.out,
      guests: guestCount,
    });

    const freeRooms = normalizeRooms(response);

    const matchedRoom = freeRooms.find(
      (item) => uid(item) === form.roomId
    );

    if (!matchedRoom) {
      setFail(
        'This room is no longer available for your selected dates. Please select another room or dates.'
      );

      await reloadRooms();
      return;
    }

    // Use the existing authenticated guest booking API.
    const result = await reservationApi.book({
      room: uid(matchedRoom),
      roomType:
        matchedRoom.roomType?._id ?? matchedRoom.roomType,
      checkInDate: form.in,
      checkOutDate: form.out,
      adults: guestCount,
      specialRequests: form.notes.trim(),
    });

    if (!result) {
      throw new Error(
        'The server did not return a reservation. Please check your reservations before trying again.'
      );
    }

    setDone(true);
  } catch (error) {
    setFail(
      error instanceof ApiError
        ? error.message
        : error?.message ||
          'We could not complete your reservation. Please try again.'
    );
  } finally {
    setBusy(false);
  }
};

  if (done) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-5 pt-24 text-center">
        <CheckCircle2 size={48} className="text-gold-ink" />

        <h1 className="mt-6 text-4xl">
          Reservation received
        </h1>

        <p className="mt-3 text-mist">
          Thank you, {form.first}. A confirmation will be sent
          to {form.email}.
        </p>

        <div className="mt-8 flex gap-3">
          <Link to="/portal/reservations" className="btn-gold">
            View my stay
          </Link>

          <Link to="/" className="btn-glass">
            Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-shell px-5 pb-24 pt-36 md:px-8">
      <p className="eyebrow">Reservation</p>

      <h1 className="mt-3 text-4xl md:text-5xl">
        Reserve your stay
      </h1>

      <form
        onSubmit={submit}
        noValidate
        className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]"
      >
        <GlassCard className="grid gap-5 p-6 sm:grid-cols-2 md:p-8">
          {fail && (
            <div className="sm:col-span-2">
              <Alert kind="error">{fail}</Alert>
            </div>
          )}

          <Input
            label="First name"
            value={form.first}
            onChange={updateField('first')}
            error={errors.first}
            autoComplete="given-name"
          />

          <Input
            label="Last name"
            value={form.last}
            onChange={updateField('last')}
            error={errors.last}
            autoComplete="family-name"
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={updateField('email')}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={updateField('phone')}
            error={errors.phone}
            autoComplete="tel"
          />

          <Input
            label="Check-in"
            type="date"
            min={todayISO()}
            value={form.in}
            onChange={updateField('in')}
            error={errors.in}
          />

          <Input
            label="Check-out"
            type="date"
            min={form.in || todayISO()}
            value={form.out}
            onChange={updateField('out')}
            error={errors.out}
          />

          <Select
            label="Guests"
            value={form.guests}
            onChange={updateField('guests')}
            error={errors.guests}
          >
            {[1, 2, 3, 4, 5, 6].map((number) => (
              <option key={number} value={String(number)}>
                {number}
              </option>
            ))}
          </Select>

          <div className="sm:col-span-2">
            <Select
              label="Room"
              value={form.roomId}
              onChange={updateField('roomId')}
              error={errors.roomId}
              required
            >
              <option value="">Select a room</option>

              {availableRooms.map((item) => (
                <option
                  key={uid(item)}
                  value={uid(item)}
                >
                  {roomTypeName(item) || 'Room'}
                  {' · '}
                  {roomNo(item)}
                  {' — '}
                  {formatCurrency(
                    Number(
                      pick(
                        item,
                        'price',
                        'pricePerNight',
                        'roomType.basePrice',
                        'roomType.price'
                      ) ?? 0
                    )
                  )}
                  {'/night ('}
                  {getRoomStatusLabel(item.status)}
                  {')'}
                </option>
              ))}
            </Select>

            {roomsLoading && (
              <p className="mt-1 text-xs text-mist">
                Loading rooms…
              </p>
            )}

            {roomsError && (
              <p className="mt-1 text-xs text-red-400">
                Could not load rooms.{' '}
                <button
                  type="button"
                  onClick={reloadRooms}
                  className="underline"
                >
                  Retry
                </button>
              </p>
            )}

            {!roomsLoading && !roomsError && !availableRooms.length && (
              <p className="mt-1 text-xs text-mist">
                No active rooms are listed. Please try again
                later or contact the hotel.
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notes" className="label">
              Special requests
            </label>

            <textarea
              id="notes"
              rows={4}
              className="field"
              value={form.notes}
              onChange={updateField('notes')}
              placeholder="Late arrival, allergies, celebrations…"
            />
          </div>
        </GlassCard>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <GlassCard className="p-6">
            <h2 className="text-2xl">Summary</h2>

            <dl className="mt-5 space-y-3 text-sm">
              {[
                ['Room', roomName],
                [
                  'Dates',
                  form.in && form.out
                    ? `${form.in} → ${form.out}`
                    : '—',
                ],
                ['Nights', String(nights)],
                ['Rate', `${formatCurrency(rate)} / night`],
                ['Taxes (16%)', formatCurrency(tax)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4"
                >
                  <dt className="text-mist">{label}</dt>
                  <dd className="text-right">{value}</dd>
                </div>
              ))}

              <div className="flex justify-between border-t border-wash/10 pt-4 text-base">
                <dt>Total</dt>
                <dd className="font-serif text-2xl text-gold-ink">
                  {formatCurrency(total)}
                </dd>
              </div>
            </dl>

            <Button
              type="submit"
              loading={busy}
              disabled={
                busy
                || roomsLoading
                || !room
                || Boolean(roomsError)
              }
              className="mt-6 w-full"
            >
              Confirm Reservation
            </Button>
          </GlassCard>
        </aside>
      </form>
    </div>
  );
}
