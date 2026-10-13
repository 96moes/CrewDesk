// src/pages/admin/MediaManage.tsx
import { useEffect, useState, type SyntheticEvent } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaVideo,
  FaEyeSlash,
  FaExternalLinkAlt,
  FaRedo,
} from "react-icons/fa";
import Modal from "../../components/Modal";
import {
  createMedia,
  deleteMedia,
  listAllMedia,
  updateMedia,
  type MediaItem,
  type MediaKind,
} from "../../api/media";

/**
 * Gallery content, managed from the panel.
 *
 * Unlike projects/tasks this page keeps its own state instead of adding a store: the
 * gallery is not read anywhere else in the app, so a store would only add indirection.
 */

interface FormState {
  title: string;
  kind: MediaKind;
  url: string;
  description: string;
  thumbnailUrl: string;
  linkUrl: string;
  sortOrder: string;
  published: boolean;
}

const EMPTY: FormState = {
  title: "",
  kind: "photo",
  url: "",
  description: "",
  thumbnailUrl: "",
  linkUrl: "",
  sortOrder: "0",
  published: true,
};

const KIND_LABELS: Record<MediaKind, string> = {
  photo: "تصویر",
  video: "ویدیو",
};

export default function MediaManage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MediaItem | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listAllMedia()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) =>
        setError(err?.response?.data?.message ?? "خطا در بارگذاری گالری"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (item: MediaItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      kind: item.kind,
      url: item.url,
      description: item.description ?? "",
      thumbnailUrl: item.thumbnailUrl ?? "",
      linkUrl: item.linkUrl ?? "",
      sortOrder: String(item.sortOrder ?? 0),
      published: item.published,
    });
    setFormError(null);
    setOpen(true);
  };

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);

    const payload = {
      title: form.title.trim(),
      kind: form.kind,
      url: form.url.trim(),
      description: form.description.trim() || undefined,
      thumbnailUrl: form.thumbnailUrl.trim() || null,
      linkUrl: form.linkUrl.trim() || null,
      sortOrder: Number(form.sortOrder) || 0,
      published: form.published,
    };

    try {
      if (editing) {
        const updated = await updateMedia(editing.id, payload);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const created = await createMedia(payload);
        setItems((prev) => [...prev, created]);
      }
      setOpen(false);
    } catch (err: unknown) {
      const message = (
        err as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;
      setFormError(
        Array.isArray(message)
          ? message.join("، ")
          : (message ?? "خطا در ذخیره‌سازی"),
      );
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await deleteMedia(confirmDelete.id);
      setItems((prev) => prev.filter((i) => i.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err: unknown) {
      const message = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(message ?? "خطا در حذف آیتم");
      setConfirmDelete(null);
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (item: MediaItem) => {
    try {
      const updated = await updateMedia(item.id, { published: !item.published });
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch {
      setError("خطا در تغییر وضعیت انتشار");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-900">
            گالری تصاویر و ویدیو
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            تصاویر و ویدیوهایی که در صفحه «ویدیو و عکس» نمایش داده می‌شوند
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-b from-primary-600 to-primary-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-all duration-200 hover:from-primary-700 hover:to-primary-800 hover:shadow-[var(--shadow-raised)]"
        >
          <FaPlus /> افزودن
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium"
          >
            <FaRedo size={10} /> تلاش دوباره
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-primary-100/80 bg-white/60"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary-200 bg-white/60 p-12 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-xl text-primary-600">
            <FaImage />
          </span>
          <p className="text-sm font-medium text-primary-900">
            هنوز محتوایی ثبت نشده است.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            برای شروع، یک تصویر یا ویدیو اضافه کنید.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-primary-100/80 bg-white/80 shadow-[var(--shadow-card)] backdrop-blur transition-shadow duration-200 hover:shadow-[var(--shadow-raised)]"
            >
              <div className="relative aspect-video bg-primary-50">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl text-primary-300">
                    {item.kind === "video" ? <FaVideo /> : <FaImage />}
                  </span>
                )}

                <span className="absolute right-2.5 top-2.5 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-bold text-primary-800 shadow-[var(--shadow-card)]">
                  {KIND_LABELS[item.kind]}
                </span>

                {!item.published && (
                  <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-lg bg-warning-700/95 px-2 py-1 text-[10px] font-bold text-white shadow-[var(--shadow-card)]">
                    <FaEyeSlash size={9} /> پیش‌نویس
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <p className="text-sm font-semibold text-primary-900">{item.title}</p>
                {item.description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-6 text-gray-500">
                    {item.description}
                  </p>
                )}

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 truncate text-[11px] text-primary-600 hover:underline"
                  dir="ltr"
                >
                  <FaExternalLinkAlt size={9} />
                  <span className="truncate">{item.url}</span>
                </a>

                <div className="mt-auto flex items-center gap-1.5 pt-4">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-xs font-medium text-primary-800 transition-colors hover:bg-primary-100"
                  >
                    <FaEdit size={11} /> ویرایش
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePublished(item)}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    title={item.published ? "پنهان کردن" : "انتشار"}
                  >
                    <FaEyeSlash size={11} />
                    {item.published ? "پنهان" : "انتشار"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(item)}
                    className="flex items-center justify-center rounded-lg bg-error-50 px-3 py-2 text-xs font-medium text-error-700 transition-colors hover:bg-error-100"
                    aria-label={`حذف ${item.title}`}
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Create / edit */}
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={editing ? "ویرایش محتوای گالری" : "افزودن محتوای گالری"}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          {/* Kind */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              نوع محتوا
            </label>
            <div className="flex gap-1 rounded-xl border border-primary-100 bg-gray-50 p-1">
              {(["photo", "video"] as MediaKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, kind: k }))}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    form.kind === k
                      ? "bg-white text-primary-800 shadow-[var(--shadow-card)]"
                      : "text-gray-500 hover:text-primary-700"
                  }`}
                >
                  {k === "photo" ? <FaImage size={11} /> : <FaVideo size={11} />}
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          </div>

          <Field label="عنوان">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              maxLength={200}
              className={inputClass}
              placeholder="مراسم افتتاحیه"
            />
          </Field>

          <Field
            label={form.kind === "video" ? "نشانی ویدیو" : "نشانی تصویر"}
            hint={
              form.kind === "video"
                ? "نشانی صفحه در آپارات یا یوتیوب؛ نشانی پخش به‌صورت خودکار ساخته می‌شود."
                : "نشانی مستقیم فایل تصویر."
            }
          >
            <input
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              required
              dir="ltr"
              className={inputClass}
              placeholder={
                form.kind === "video"
                  ? "https://www.aparat.com/v/abc123"
                  : "https://example.com/photo.jpg"
              }
            />
          </Field>

          <Field label="توضیح (اختیاری)">
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={2}
              maxLength={500}
              className={`${inputClass} resize-none`}
              placeholder="گزارش کوتاه از رویداد"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="تصویر بندانگشتی (اختیاری)"
              hint={form.kind === "video" ? "برای یوتیوب خودکار است." : undefined}
            >
              <input
                value={form.thumbnailUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))
                }
                dir="ltr"
                className={inputClass}
                placeholder="https://..."
              />
            </Field>

            <Field label="ترتیب نمایش">
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: e.target.value }))
                }
                dir="ltr"
                className={inputClass}
              />
            </Field>
          </div>

          <Field
            label="پیوند خارجی (اختیاری)"
            hint="اگر پر شود، آیتم به‌جای نمایش درون‌صفحه، به این نشانی پیوند می‌خورد."
          >
            <input
              value={form.linkUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              dir="ltr"
              className={inputClass}
              placeholder="https://..."
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-gray-50 px-3.5 py-3">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) =>
                setForm((f) => ({ ...f, published: e.target.checked }))
              }
              className="h-4 w-4 accent-primary-700"
            />
            <span className="text-xs font-medium text-gray-700">
              نمایش در گالری عمومی
            </span>
          </label>

          {formError && (
            <p className="rounded-xl bg-error-50 px-3.5 py-2.5 text-xs text-error-700">
              {formError}
            </p>
          )}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-gradient-to-b from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-all hover:from-primary-700 hover:to-primary-800 disabled:opacity-60"
            >
              {busy ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "افزودن"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => !busy && setConfirmDelete(null)}
        title="حذف محتوای گالری"
      >
        <p className="text-sm leading-7 text-gray-600">
          آیا از حذف «{confirmDelete?.title}» مطمئن هستید؟ این عمل قابل بازگشت نیست.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmDelete(null)}
            disabled={busy}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={doDelete}
            disabled={busy}
            className="rounded-xl bg-error-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-error-700 disabled:opacity-60"
          >
            {busy ? "در حال حذف..." : "حذف"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-primary-100 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] leading-5 text-gray-400">{hint}</p>}
    </div>
  );
}
