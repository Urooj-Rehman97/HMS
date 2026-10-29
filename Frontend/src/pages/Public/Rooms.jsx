import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import {
  Users,
  ArrowUpRight,
  Wifi,
  Coffee,
  Bath,
  Tv,
  Sparkles,
  BedDouble,
  Search,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

import {
  SectionHeading,
  SmartImage,
  GlassCard,
  Skeleton,
} from '../../components/ui';

import {
  EmptyState,
  ErrorState,
} from '../../components/common/EmptyState';

import { useFetch } from '../../hooks/useFetch';
import { roomApi } from '../../services/roomApi';

import {
  imageUrl,
  pick,
  roomNo,
  roomTypeName,
  uid,
} from '../../utils/entity';

import { formatCurrency } from '../../utils/formatCurrency';

const amenitiesIcons = [
  Wifi,
  Coffee,
  Bath,
  Tv,
  Sparkles,
  BedDouble,
];

const roomPrice = (room) =>
  Number(
    pick(
      room,
      'price',
      'pricePerNight',
      'roomRate',
      'roomType.basePrice',
      'roomType.price',
      'roomType.basePricePerNight'
    ) ?? 0
  );

const roomCapacity = (room) =>
  Number(
    pick(room, 'capacity', 'maxGuests', 'roomType.capacity') ?? 2
  );

const statusLabel = (status) =>
  ({
    AVAILABLE: 'Available',
    VACANT: 'Ready for guests',
    CLEANING: 'Currently cleaning',
    OCCUPIED: 'Currently occupied',
    MAINTENANCE: 'Under maintenance',
  }[String(status || '').toUpperCase()] ||
    'Room status updated');

export function RoomsList() {
  const {
    data,
    loading,
    error,
    reload,
  } = useFetch(() => roomApi.available(), []);

  // API response null ya non-array ho tab bhi page crash nahi hoga.
  const rooms = Array.isArray(data) ? data : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [persons, setPersons] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    document.title = 'Rooms & Suites — LuxuryStay';
  }, []);

  // Room types available in the current inventory.
  const roomTypes = useMemo(() => {
    const types = rooms
      .filter(Boolean)
      .map((room) => roomTypeName(room))
      .filter(Boolean);

    return [...new Set(types)];
  }, [rooms]);

  // Prevent .map() errors if rooms is null.
  const maxCapacity = useMemo(
    () =>
      Math.max(
        2,
        ...rooms
          .filter(Boolean)
          .map((room) => roomCapacity(room))
          .filter((capacity) => Number.isFinite(capacity))
      ),
    [rooms]
  );

  const filteredRooms = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);
    const guestCount = persons === 'all' ? null : Number(persons);

    return rooms.filter((room) => {
      if (!room) return false;

      const title = roomTypeName(room) || 'Guest Room';
      const number = String(roomNo(room) ?? '');
      const price = roomPrice(room);
      const capacity = roomCapacity(room);

      // Search by room name/type or room number.
      const matchesSearch =
        !search ||
        title.toLowerCase().includes(search) ||
        number.toLowerCase().includes(search);

      // Filter by room type.
      const matchesType =
        selectedType === 'all' || title === selectedType;

      // Filter by number of guests.
      const matchesPersons =
        guestCount === null || capacity >= guestCount;

      // Filter by minimum and maximum price.
      const matchesMin =
        min === null || (Number.isFinite(price) && price >= min);

      const matchesMax =
        max === null || (Number.isFinite(price) && price <= max);

      return (
        matchesSearch &&
        matchesType &&
        matchesPersons &&
        matchesMin &&
        matchesMax
      );
    });
  }, [rooms, searchTerm, selectedType, persons, minPrice, maxPrice]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setPersons('all');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="mx-auto max-w-shell px-5 pb-24 pt-36 md:px-8">
      <SectionHeading
        eyebrow="Rooms & Suites"
        title="Choose your stay."
        sub="Explore LuxuryStay rooms, compare nightly rates, and find a room that fits your needs."
      />

      {/* Search and filters */}
      <GlassCard className="mt-10 p-5 md:p-6">
        <div className="mb-5 flex items-center gap-2">
          <SlidersHorizontal size={20} className="text-gold-ink" />
          <h2 className="text-lg font-medium">Find your room</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Search */}
          <div>
            <label
              htmlFor="room-search"
              className="mb-2 block text-sm text-mist"
            >
              Search room
            </label>

            <div className="flex items-center gap-2 rounded-lg border border-white/15 px-3">
              <Search size={17} className="shrink-0 text-mist" />

              <input
                id="room-search"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Room name or number"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-mist/60"
              />
            </div>
          </div>

          {/* Room type */}
          <div>
            <label
              htmlFor="room-type-filter"
              className="mb-2 block text-sm text-mist"
            >
              Room type
            </label>

            <select
              id="room-type-filter"
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#10251e] px-3 py-3 text-sm outline-none"
            >
              <option value="all">All room types</option>

              {roomTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Persons */}
          <div>
            <label
              htmlFor="room-persons-filter"
              className="mb-2 block text-sm text-mist"
            >
              Number of guests
            </label>

            <select
              id="room-persons-filter"
              value={persons}
              onChange={(event) => setPersons(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#10251e] px-3 py-3 text-sm outline-none"
            >
              <option value="all">Any number of guests</option>

              {Array.from(
                { length: Math.max(1, Math.min(maxCapacity, 20)) },
                (_, index) => index + 1
              ).map((count) => (
                <option key={count} value={String(count)}>
                  {count} {count === 1 ? 'guest' : 'guests'}
                </option>
              ))}
            </select>
          </div>

          {/* Minimum price */}
          <div>
            <label
              htmlFor="room-min-price"
              className="mb-2 block text-sm text-mist"
            >
              Minimum price per night
            </label>

            <input
              id="room-min-price"
              type="number"
              min="0"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="e.g. 5000"
              className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-mist/60"
            />
          </div>

          {/* Maximum price */}
          <div>
            <label
              htmlFor="room-max-price"
              className="mb-2 block text-sm text-mist"
            >
              Maximum price per night
            </label>

            <input
              id="room-max-price"
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="e.g. 15000"
              className="w-full rounded-lg border border-white/15 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-mist/60"
            />
          </div>

          {/* Reset */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-3 text-sm transition hover:border-gold/60 hover:text-gold-ink"
            >
              <RotateCcw size={16} />
              Reset Filters
            </button>
          </div>
        </div>

        <p className="mt-5 text-sm text-mist">
          {loading
            ? 'Loading rooms...'
            : `Showing ${filteredRooms.length} of ${rooms.length} rooms`}
        </p>
      </GlassCard>

      {/* Error state */}
      {error && (
        <div className="mt-8">
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {[0, 1, 2, 3].map((number) => (
            <Skeleton key={number} className="h-80" />
          ))}
        </div>
      ) : !error && filteredRooms.length > 0 ? (
        /* Room cards */
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {filteredRooms.map((room) => {
            const typeId = uid(room.roomType);
            const title = roomTypeName(room) || 'Guest Room';

            const amenities =
              pick(room, 'amenities', 'roomType.amenities') ?? [];

            const image =
              imageUrl(
                pick(
                  room,
                  'images.0',
                  'image',
                  'roomType.images.0'
                )
              ) || '/images/deluxe.jpg';

            return (
              <GlassCard
                key={room._id}
                className="group overflow-hidden rounded-2xl transition hover:border-gold/40"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <SmartImage
                    src={image}
                    alt={`${title} at LuxuryStay`}
                    className="transition duration-700 group-hover:scale-105"
                  />

                  <span className="absolute left-3 top-3 rounded-full border border-emerald-400/30 bg-black/70 px-3 py-1 text-xs text-emerald-200">
                    {statusLabel(room.status)}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl">{title}</h2>

                      <p className="mt-1 text-sm text-mist">
                        Room {roomNo(room)}
                        {room.floor !== undefined &&
                        room.floor !== null
                          ? ` · Floor ${room.floor}`
                          : ''}
                      </p>
                    </div>

                    <p className="text-right text-xs text-mist">
                      per night
                      <br />
                      <span className="font-serif text-2xl text-gold-ink">
                        {formatCurrency(roomPrice(room))}
                      </span>
                    </p>
                  </div>

                  {pick(
                    room,
                    'description',
                    'roomType.description'
                  ) && (
                    <p className="mt-3 text-sm leading-relaxed text-mist">
                      {pick(
                        room,
                        'description',
                        'roomType.description'
                      )}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Users size={13} />
                      Up to {roomCapacity(room)} guests
                    </span>

                    {Array.isArray(amenities) &&
                      amenities.slice(0, 3).map((amenity, index) => {
                        const Icon =
                          amenitiesIcons[
                            index % amenitiesIcons.length
                          ];

                        return (
                          <span
                            key={`${amenity}-${index}`}
                            className="flex items-center gap-1"
                          >
                            <Icon size={13} />
                            {amenity}
                          </span>
                        );
                      })}
                  </div>

                  <Link
                    to={`/reserve?roomId=${encodeURIComponent(
                      room._id
                    )}&roomType=${encodeURIComponent(typeId ?? '')}`}
                    className="btn-gold mt-6 inline-flex items-center gap-2"
                  >
                    Reserve this room
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : !error && !loading ? (
        <div className="mt-12">
          <GlassCard className="p-8">
            <EmptyState
              title={
                rooms.length > 0
                  ? 'No rooms match your filters'
                  : 'No rooms available right now'
              }
              text={
                rooms.length > 0
                  ? 'Try changing the room type, guest count, or price range.'
                  : 'There are no active rooms listed at the moment. Please check again later or contact LuxuryStay for assistance.'
              }
            />

            {rooms.length > 0 && (
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn-gold inline-flex items-center gap-2"
                >
                  <RotateCcw size={15} />
                  Reset Filters
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}

// Legacy room-detail URLs redirect to the public rooms listing.
export function RoomDetail() {
  const { slug } = useParams();

  return (
    <Navigate
      to="/rooms"
      replace
      state={{ requestedRoom: slug }}
    />
  );
}

// Required by React.lazy() in AppRoutes.jsx.
export default RoomsList;