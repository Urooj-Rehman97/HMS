import { useState } from 'react';
import Modal from './Modal';
import { Button } from './Button';
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onClose }) {
    const [busy, setBusy] = useState(false);
    const go = async () => { setBusy(true); try {
        await onConfirm();
        onClose();
    }
    catch { /* the caller already reported the failure; keep the dialog open */ }
    finally {
        setBusy(false);
    } };
    return (<Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-relaxed text-mist">{message}</p>
      <div className="mt-6 flex justify-end gap-3"><Button variant="glass" onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'gold'} loading={busy} onClick={go}>{confirmLabel}</Button></div>
    </Modal>);
}
