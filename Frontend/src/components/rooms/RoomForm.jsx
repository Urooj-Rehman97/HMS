import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { Input, Select, Textarea } from '../Field';
import { Button } from '../ui';
import Alert from '../common/Alert';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../common/Toast';
import { roomApi } from '../../services';
import { ROOM_STATUSES, labelOf } from '../../utils/constants';
import { RX, intRange, maxLen, moneyRule } from '../../utils/validators';
import { idOf, imageUrl } from '../../utils/entity';
const validate = (v) => ({
    roomNumber: !v.roomNumber.trim() ? 'Room number is required' : RX.roomNumber.test(v.roomNumber.trim()) ? '' : 'Use letters, numbers or hyphens (max 10), e.g. 305 or 12B',
    roomType: v.roomType ? '' : 'Choose a room type', floor: intRange(v.floor, 0, 100, 'Floor'),
    price: moneyRule(v.price, 'Price override', 0, false), status: '', notes: maxLen(v.notes, 500, 'Notes'),
});
/** Create (POST /rooms) or edit (PUT /rooms/:id) a room. Price is an optional override of the room type's base price. */
export default function RoomForm({ open, room, types, onClose, onSaved }) {
    const toast = useToast();
    const [imageFile, setImageFile] = useState(null);
    const [imageError, setImageError] = useState('');
    const init = () => ({ roomNumber: room?.roomNumber ?? '', roomType: idOf(room?.roomType), floor: String(room?.floor ?? 1), price: room?.price != null ? String(room.price) : '', status: room?.status ?? 'AVAILABLE', notes: room?.notes ?? '' });
    const f = useForm(init(), validate);
    useEffect(() => { if (open) { f.reset(init()); setImageFile(null); setImageError(''); } }, [open, room?._id]); // eslint-disable-line react-hooks/exhaustive-deps
    const submit = (e) => {
        e.preventDefault();
        f.submit(async (v) => {
            const body = { roomNumber: v.roomNumber.trim(), roomType: v.roomType, floor: Number(v.floor), notes: v.notes.trim() };
            if (v.price.trim() !== '')
                body.price = Number(v.price);
            else if (room)
                body.price = null;
            if (!room)
                body.status = v.status;
            const saved = room ? await roomApi.update(room._id, body) : await roomApi.create(body);
            const roomId = room?._id ?? saved?._id ?? saved?.data?._id;
            if (imageFile) {
                if (!roomId) throw new Error('Room saved, but its ID was not returned. Reload the room list and upload the image by editing the room.');
                try { await roomApi.uploadImage(roomId, imageFile); }
                catch (uploadErr) { setImageError(uploadErr.message || 'Room saved, but image upload failed.'); throw uploadErr; }
            }
            toast.success(room ? 'Room updated' : 'Room created');
            onSaved();
            onClose();
        });
    };
    const v = f.values, e = f.errors;
    return (<Modal open={open} onClose={onClose} title={room ? `Edit room ${room.roomNumber}` : 'Add room'}>
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        <Input label="Room number" required maxLength={10} value={v.roomNumber} onChange={f.onChange('roomNumber')} onBlur={f.onBlur('roomNumber')} error={e.roomNumber}/>
        <Select label="Room type" required value={v.roomType} onChange={f.onChange('roomType')} onBlur={f.onBlur('roomType')} error={e.roomType}><option value="">Select…</option>{types.filter(t => t.isActive !== false || t._id === idOf(room?.roomType)).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}</Select>
        <Input label="Floor" type="number" min={0} required value={v.floor} onChange={f.onChange('floor')} onBlur={f.onBlur('floor')} error={e.floor}/>
        <Input label="Price override" type="number" min={0} step="any" value={v.price} onChange={f.onChange('price')} onBlur={f.onBlur('price')} error={e.price} hint="Leave empty to use the room type's base price."/>
        {!room && <Select label="Starting status" value={v.status} onChange={f.onChange('status')}>{ROOM_STATUSES.map(s => <option key={s} value={s}>{labelOf(s)}</option>)}</Select>}
        <div className="sm:col-span-2 space-y-2">
          <label className="label" htmlFor="room-image">Room image {room?.image ? '(choose a file to replace it)' : '(optional)'}</label>
          {room?.image && !imageFile && <img src={imageUrl(room.image)} alt={`Room ${room.roomNumber}`} className="h-32 w-48 rounded-xl object-cover" />}
          <input id="room-image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => { const file = event.target.files?.[0] ?? null; setImageError(''); if (file && file.size > 5 * 1024 * 1024) { setImageFile(null); setImageError('Image must be 5 MB or smaller.'); event.target.value = ''; return; } setImageFile(file); }} className="field file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-4 file:py-1.5 file:text-gold-ink" />
          {imageFile && <p className="text-xs text-muted">Selected: {imageFile.name}</p>}
          {imageError && <p role="alert" className="text-xs text-red-500">{imageError}</p>}
          <p className="text-xs text-muted">JPG, PNG, WEBP or GIF · maximum 5 MB. The image is stored on your server, not as demo data.</p>
        </div>
        <div className="sm:col-span-2"><Textarea label="Notes" rows={3} maxLength={500} value={v.notes} onChange={f.onChange('notes')} error={e.notes}/></div>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>{room ? 'Save changes' : 'Create room'}</Button></div>
      </form>
    </Modal>);
}
