import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getBulkMessageRequests,
  markBulkMessageSent,
  type BulkMessageEntry,
  type BulkMessageRequest,
} from "../../api/groups";

type QueueFilter = "pending" | "all" | "sent";

export default function BulkMessages() {
  const [requests, setRequests] = useState<BulkMessageRequest[] | null>(null);
  const [filter, setFilter] = useState<QueueFilter>("pending");
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const result = await getBulkMessageRequests();
    setRequests(result);
  }, []);

  useEffect(() => {
    getBulkMessageRequests()
      .then(setRequests)
      .catch((err) =>
        setError(err?.response?.data?.message ?? "خطا در بارگذاری پیام‌ها"),
      );
  }, []);

  const counts = useMemo(() => {
    const entries = (requests ?? []).flatMap((request) => request.messages);
    return {
      pending: entries.filter((message) => message.status === "pending").length,
      sent: entries.filter((message) => message.status === "sent").length,
      all: entries.length,
    };
  }, [requests]);

  const visibleRequests = (requests ?? [])
    .map((request) => ({
      ...request,
      messages: request.messages.filter((message) =>
        filter === "all" ? true : message.status === filter,
      ),
    }))
    .filter((request) => request.messages.length > 0);

  const copyContent = async (message: BulkMessageEntry) => {
    setError(null);
    setNotice(null);
    try {
      await navigator.clipboard.writeText(message.content);
      setNotice(`متن پیام برای ${message.phone} کپی شد.`);
    } catch {
      setError("دسترسی به کلیپ‌بورد ممکن نشد. مجوز مرورگر را بررسی کنید.");
    }
  };

  const markSent = async (message: BulkMessageEntry) => {
    setBusyId(message.id);
    setError(null);
    setNotice(null);
    try {
      // The saved row is what the queue shows: it carries the server's own sentAt rather than a
      // timestamp this tab guessed.
      const saved = await markBulkMessageSent(message.id);
      setRequests((current) =>
        (current ?? []).map((request) => ({
          ...request,
          messages: request.messages.map((entry) =>
            entry.id === message.id ? saved : entry,
          ),
        })),
      );
      setNotice(`پیام ${message.phone} به‌عنوان ارسال‌شده ثبت شد.`);
    } catch (err) {
      const responseMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setError(responseMessage ?? "خطا در ثبت وضعیت ارسال");
    } finally {
      setBusyId(null);
    }
  };

  const filterOptions: { value: QueueFilter; label: string }[] = [
    { value: "pending", label: `در انتظار (${counts.pending})` },
    { value: "all", label: `همه (${counts.all})` },
    { value: "sent", label: `ارسال‌شده (${counts.sent})` },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-800">صف پیام‌های گروهی</h1>
          <p className="mt-1 text-sm text-gray-500">متن را کپی کنید، برای شماره مقصد بفرستید و وضعیت را ثبت کنید.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            refresh()
              .catch((err) => setError(err?.response?.data?.message ?? "خطا در بارگذاری پیام‌ها"))
              .finally(() => setRefreshing(false));
          }}
          disabled={refreshing}
          className="rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-800 hover:bg-primary-50"
        >
          {refreshing ? "در حال تازه‌سازی…" : "تازه‌سازی صف"}
        </button>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700">{notice}</div>}

      <div className="mb-5 flex flex-wrap gap-2" aria-label="فیلتر پیام‌ها">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            aria-pressed={filter === option.value}
            className={`rounded-full px-4 py-2 text-sm ${filter === option.value ? "bg-primary-700 text-white" : "bg-white text-gray-700 ring-1 ring-primary-100 hover:bg-primary-50"}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {requests === null && !error ? (
        <p className="py-8 text-center text-sm text-gray-500">در حال بارگذاری صف پیام‌ها…</p>
      ) : visibleRequests.length === 0 ? (
        <div className="rounded-xl border border-primary-100 bg-white p-8 text-center text-sm text-gray-500">
          {requests === null
            ? "بارگذاری صف انجام نشد؛ پس از بررسی خطا دوباره تلاش کنید."
            : filter === "pending"
              ? "پیام در انتظاری وجود ندارد."
              : "پیامی برای نمایش وجود ندارد."}
        </div>
      ) : (
        <div className="space-y-5">
          {visibleRequests.map((request) => (
            <section key={request.id} className="overflow-hidden rounded-xl border border-primary-100 bg-white">
              <header className="flex flex-wrap items-center justify-between gap-2 bg-primary-50 px-4 py-3">
                <div>
                  <h2 className="font-semibold text-primary-800">{request.groupName}</h2>
                  <p className="text-xs text-gray-600">
                    ثبت‌کننده: {request.requestedBy} · {new Date(request.createdAt).toLocaleString("fa-IR")}
                  </p>
                </div>
                <span className="text-xs text-gray-600">{request.messages.length} پیام در این نما</span>
              </header>
              <div className="divide-y divide-primary-50">
                {request.messages.map((message) => (
                  <article key={message.id} className="grid gap-3 p-4 lg:grid-cols-[170px_1fr_auto] lg:items-start">
                    <div>
                      <p className="text-xs text-gray-500">شماره مقصد</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-gray-800" dir="ltr">{message.phone}</p>
                    </div>
                    <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-800">{message.content}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyContent(message)}
                        className="rounded-lg border border-primary-300 px-3 py-2 text-sm font-medium text-primary-800 hover:bg-primary-50"
                      >
                        کپی متن
                      </button>
                      {message.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => markSent(message)}
                          disabled={busyId === message.id}
                          className="rounded-lg bg-success-700 px-3 py-2 text-sm font-medium text-white hover:bg-success-800 disabled:opacity-60"
                        >
                          {busyId === message.id ? "در حال ثبت…" : "ثبت ارسال"}
                        </button>
                      ) : (
                        <span className="rounded-full bg-success-50 px-3 py-2 text-xs font-medium text-success-700">
                          ارسال‌شده
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
