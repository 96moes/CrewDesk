// src/pages/admin/OpportunitiesManage.tsx
import { useEffect, useState, type SyntheticEvent } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaHandsHelping,
  FaEyeSlash,
  FaExternalLinkAlt,
  FaRedo,
} from "react-icons/fa";
import Modal from "../../components/Modal";
import {
  createOpportunity,
  deleteOpportunity,
  listAllOpportunities,
  updateOpportunity,
  DEFAULT_ACTION_LABEL,
  isExternalAction,
  type Opportunity,
} from "../../api/opportunities";

/**
 * Cooperation opportunities, managed from the panel.
 *
 * Like the gallery page, this keeps its own state instead of adding a store: the public
 * cooperation page is the only other reader, so a store would only add indirection.
 */

interface FormState {
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  sortOrder: string;
  published: boolean;
}

const EMPTY: FormState = {
  title: "",
  description: "",
  actionLabel: "",
  actionUrl: "",
  sortOrder: "0",
  published: true,
};

export default function OpportunitiesManage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Opportunity | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    listAllOpportunities()
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ?? "خطا در بارگذاری فرصت‌های همکاری",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  /** Back to the skeleton, then a fresh request. */
  const load = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (item: Opportunity) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      actionLabel: item.actionLabel ?? "",
      actionUrl: item.actionUrl ?? "",
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
      description: form.description.trim() || undefined,
      actionLabel: form.actionLabel.trim() || null,
      actionUrl: form.actionUrl.trim() || null,
      sortOrder: Number(form.sortOrder) || 0,
      published: form.published,
    };

    try {
      if (editing) {
        const updated = await updateOpportunity(editing.id, payload);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const created = await createOpportunity(payload);
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
      await deleteOpportunity(confirmDelete.id);
      setItems((prev) => prev.filter((i) => i.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err: unknown) {
      const message = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(message ?? "خطا در حذف فرصت همکاری");
      setConfirmDelete(null);
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (item: Opportunity) => {
    try {
      const updated = await updateOpportunity(item.id, {
        published: !item.published,
      });
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
            فرصت‌های همکاری
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            کارت‌هایی که در صفحه «فرصت‌های همکاری» نمایش داده می‌شوند
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
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-primary-100/80 bg-white/60"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary-200 bg-white/60 p-12 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-xl text-primary-600">
            <FaHandsHelping />
          </span>
          <p className="text-sm font-medium text-primary-900">
            هنوز فرصت همکاری ثبت نشده است.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            بدون ثبت موردی، صفحه عمومی «فرصت‌های همکاری» خالی می‌ماند.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col rounded-2xl border border-primary-100/80 bg-white/80 p-5 shadow-[var(--shadow-card)] backdrop-blur"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-primary-900">
                  {item.title}
                </h2>
                <div className="flex shrink-0 items-center gap-1.5">
                  {!item.published && (
                    <span className="flex items-center gap-1 rounded-lg bg-warning-700/95 px-2 py-1 text-[10px] font-bold text-white">
                      <FaEyeSlash size={9} /> پیش‌نویس
                    </span>
                  )}
                  <span className="rounded-lg bg-primary-50 px-2 py-1 text-[10px] font-bold text-primary-700">
                    ترتیب {item.sortOrder}
                  </span>
                </div>
              </div>

              {item.description && (
                <p className="text-xs leading-6 text-gray-500">
                  {item.description}
                </p>
              )}

              <p className="mt-2 text-[11px] text-gray-400">
                دکمه: <span className="text-gray-600">
                  {item.actionLabel?.trim() || DEFAULT_ACTION_LABEL}
                </span>
                {" — "}
                {item.actionUrl ? (
                  <a
                    href={item.actionUrl}
                    target={isExternalAction(item.actionUrl) ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                    dir="ltr"
                  >
                    <FaExternalLinkAlt size={9} />
                    <span className="truncate">{item.actionUrl}</span>
                  </a>
                ) : (
                  <span className="text-gray-600">فرم ثبت‌نام</span>
                )}
              </p>

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
            </li>
          ))}
        </ul>
      )}

      {/* Create / edit */}
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={editing ? "ویرایش فرصت همکاری" : "افزودن فرصت همکاری"}
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="عنوان">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              maxLength={200}
              className={inputClass}
              placeholder="همکاری داوطلبانه"
            />
          </Field>

          <Field label="توضیح (اختیاری)">
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              maxLength={500}
              className={`${inputClass} resize-none`}
              placeholder="پیوستن به تیم داوطلبان در رویدادها و برنامه‌های فرهنگی."
            />
          </Field>

          <Field
            label="متن دکمه (اختیاری)"
            hint={`اگر خالی بماند، «${DEFAULT_ACTION_LABEL}» نمایش داده می‌شود.`}
          >
            <input
              value={form.actionLabel}
              onChange={(e) =>
                setForm((f) => ({ ...f, actionLabel: e.target.value }))
              }
              maxLength={100}
              className={inputClass}
              placeholder={DEFAULT_ACTION_LABEL}
            />
          </Field>

          <Field
            label="نشانی دکمه (اختیاری)"
            hint="اگر خالی بماند، دکمه بازدیدکننده را به فرم ثبت‌نام می‌فرستد."
          >
            <input
              value={form.actionUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, actionUrl: e.target.value }))
              }
              dir="ltr"
              className={inputClass}
              placeholder="https://t.me/..."
            />
          </Field>

          <div className="grid grid-cols-2 items-end gap-3">
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
                نمایش در صفحه عمومی
              </span>
            </label>
          </div>

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
        title="حذف فرصت همکاری"
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
