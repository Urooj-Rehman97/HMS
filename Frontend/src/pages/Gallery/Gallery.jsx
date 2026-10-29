import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Input, Select, Textarea } from '../../components/Field';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { FilterSelect, Toolbar } from '../../components/common/Toolbar';
import { useFetch } from '../../hooks/useFetch';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../components/common/Toast';
import { galleryApi } from '../../services';
import { GALLERY_CATEGORIES } from '../../utils/constants';
import { imageUrl } from '../../utils/entity';
import { intRange, maxLen } from '../../utils/validators';
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX = 5 * 1024 * 1024;
/** Admin/Manager gallery management: GET /gallery, POST (multipart "image"), PUT, PATCH (de)activate, DELETE. The public site shows only active images. */
export default function GalleryAdmin() {
    const toast = useToast();
    const [cat, setCat] = useState('All');
    const { data, loading, error, reload } = useFetch(async () => (await galleryApi.list({ limit: 100 })).items, []);
    const [edit, setEdit] = useState(undefined);
    const [del, setDel] = useState(null);
    const rows = (data ?? []).filter(g => cat === 'All' || g.category === cat);
    const toggle = async (g) => { try {
        await galleryApi.setActive(g._id, g.isActive === false);
        toast.success(g.isActive === false ? 'Image is now public' : 'Image hidden from the website');
        reload();
    }
    catch (e) {
        toast.error(e.message);
    } };
    return (<>
      <PageHeader title="Gallery" sub="Photos shown on the public website’s Gallery page." actions={<Button onClick={() => setEdit(null)}><Plus size={16}/> Upload image</Button>}/>
      <Toolbar><FilterSelect label="Categories" value={cat} onChange={setCat} options={GALLERY_CATEGORIES}/></Toolbar>
      {error ? <ErrorState onRetry={reload} message={error}/> : loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-56"/>)}</div> : !rows.length ? <div className="glass rounded-2xl"><EmptyState title="No images" text="Upload your first photo."/></div> : (<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{rows.map(g => (<figure key={g._id} className={`glass overflow-hidden rounded-2xl ${g.isActive === false ? 'opacity-60' : ''}`}>
            <img src={imageUrl(g.image)} alt={g.title} loading="lazy" decoding="async" className="h-40 w-full object-cover"/>
            <figcaption className="p-4"><div className="flex items-start justify-between gap-2"><p className="truncate font-medium">{g.title}</p><StatusBadge status={g.isActive === false ? 'HIDDEN' : 'ACTIVE'}/></div><p className="text-xs text-muted">{g.category} · order {g.displayOrder ?? 0}</p>
              <div className="mt-3 flex flex-wrap gap-2"><Button variant="glass" className="!px-3 !py-1 text-xs" onClick={() => setEdit(g)}>Edit</Button><Button variant="glass" className="!px-3 !py-1 text-xs" onClick={() => toggle(g)}>{g.isActive === false ? 'Show' : 'Hide'}</Button><Button variant="danger" className="!px-3 !py-1 text-xs" onClick={() => setDel(g)}>Delete</Button></div></figcaption>
          </figure>))}</div>)}
      <GalleryForm open={edit !== undefined} item={edit} onClose={() => setEdit(undefined)} onSaved={reload}/>
      <ConfirmDialog open={!!del} danger title="Delete this image?" message="The photo is removed from the website and the server." confirmLabel="Delete" onClose={() => setDel(null)} onConfirm={async () => { try {
        await galleryApi.remove(del._id);
        toast.success('Image deleted');
        reload();
    }
    catch (e) {
        toast.error(e.message);
        throw e;
    } }}/>
    </>);
}
function GalleryForm({ open, item, onClose, onSaved }) {
    const toast = useToast();
    const [file, setFile] = useState(null);
    const [fileErr, setFileErr] = useState('');
    const ref = useRef(null);
    const init = () => ({ title: item?.title ?? '', description: item?.description ?? '', category: item?.category ?? 'Other', displayOrder: String(item?.displayOrder ?? 0) });
    const f = useForm(init(), v => ({ title: !v.title.trim() ? 'Title is required' : v.title.length > 150 ? 'Title must be 150 characters or fewer' : '', description: maxLen(v.description, 1000, 'Description'), displayOrder: intRange(v.displayOrder, 0, 9999, 'Display order') }));
    useEffect(() => { if (open) {
        f.reset(init());
        setFile(null);
        setFileErr('');
    } }, [open, item?._id]); // eslint-disable-line react-hooks/exhaustive-deps
    const pick = (x) => { setFileErr(''); if (!x)
        return setFile(null); if (!OK_TYPES.includes(x.type)) {
        setFileErr('Choose a JPG, PNG, WEBP or GIF image');
        return setFile(null);
    } if (x.size > MAX) {
        setFileErr('Image must be 5 MB or smaller');
        return setFile(null);
    } setFile(x); };
    const go = (e) => {
        e.preventDefault();
        if (!item && !file) {
            setFileErr('Choose an image to upload');
            f.submit(async () => { });
            return;
        }
        f.submit(async (v) => { const fd = new FormData(); fd.append('title', v.title.trim()); fd.append('description', v.description.trim()); fd.append('category', v.category); fd.append('displayOrder', v.displayOrder); if (file)
            fd.append('image', file); item ? await galleryApi.update(item._id, fd) : await galleryApi.create(fd); toast.success(item ? 'Image updated' : 'Image uploaded'); onSaved(); onClose(); });
    };
    return (<Modal open={open} onClose={onClose} title={item ? 'Edit image' : 'Upload image'}>
      <form onSubmit={go} noValidate className="grid gap-4 sm:grid-cols-2">
        {f.formError && <div className="sm:col-span-2"><Alert kind="error">{f.formError}</Alert></div>}
        <div className="sm:col-span-2"><label className="label" htmlFor="gal-file">Image {item ? '(leave empty to keep the current one)' : ''}</label><input id="gal-file" ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => pick(e.target.files?.[0])} className="field file:mr-3 file:rounded-full file:border-0 file:bg-gold/15 file:px-4 file:py-1.5 file:text-gold-ink"/>{fileErr && <p role="alert" className="mt-1 text-xs text-red-500">{fileErr}</p>}{file && <p className="mt-1 text-xs text-muted">{file.name} · {(file.size / 1024).toFixed(0)} KB</p>}</div>
        <div className="sm:col-span-2"><Input label="Title" required maxLength={150} value={f.values.title} onChange={f.onChange('title')} onBlur={f.onBlur('title')} error={f.errors.title}/></div>
        <Select label="Category" value={f.values.category} onChange={f.onChange('category')}>{GALLERY_CATEGORIES.map(c => <option key={c}>{c}</option>)}</Select>
        <Input label="Display order" type="number" min={0} value={f.values.displayOrder} onChange={f.onChange('displayOrder')} error={f.errors.displayOrder} hint="Lower numbers appear first."/>
        <div className="sm:col-span-2"><Textarea label="Description" rows={2} maxLength={1000} value={f.values.description} onChange={f.onChange('description')} error={f.errors.description}/></div>
        <div className="flex justify-end gap-3 sm:col-span-2"><Button variant="glass" onClick={onClose}>Cancel</Button><Button type="submit" loading={f.submitting}>{item ? 'Save changes' : 'Upload'}</Button></div>
      </form>
    </Modal>);
}
