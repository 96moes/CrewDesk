import { useEffect, useState, type FormEvent } from "react";
import { useAuthStore } from "../stores/authStore";
import {
  addGroupMember,
  createGroup,
  getMyGroups,
  removeGroupMember,
  searchGroupMemberCandidates,
  submitGroupMessage,
  type GroupMemberCandidate,
  type ManagedGroup,
} from "../api/groups";

/**
 * How much of the query the search box needs before it asks the API. The API itself returns
 * nothing below this length, so the two agree rather than the client guessing.
 */
const MIN_SEARCH_LENGTH = 3;

export default function GroupsManage() {
  const user = useAuthStore((state) => state.user);
  const [groups, setGroups] = useState<ManagedGroup[]>([]);
  const [groupName, setGroupName] = useState("");
  const [memberQueries, setMemberQueries] = useState<Record<string, string>>({});
  /**
   * Search results per group. A group is absent until its manager has searched, which is how the
   * page tells "no results" apart from "nothing searched yet".
   */
  const [memberMatches, setMemberMatches] = useState<
    Record<string, GroupMemberCandidate[]>
  >({});
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getMyGroups()
      .then(setGroups)
      .catch((err) =>
        setError(err?.response?.data?.message ?? "خطا در بارگذاری گروه‌ها"),
      )
      .finally(() => setLoading(false));
  }, []);

  const showFailure = (err: unknown, fallback: string) => {
    const responseMessage = (
      err as { response?: { data?: { message?: string | string[] } } }
    )?.response?.data?.message;
    setError(
      Array.isArray(responseMessage)
        ? responseMessage.join("، ")
        : responseMessage ?? fallback,
    );
    setSuccess(null);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("create");
    setError(null);
    try {
      const group = await createGroup(groupName.trim());
      setGroups((current) => [group, ...current]);
      setGroupName("");
      setSuccess("گروه با موفقیت ساخته شد.");
    } catch (err) {
      showFailure(err, "خطا در ایجاد گروه");
    } finally {
      setBusy(null);
    }
  };

  /**
   * Look an account up by name or phone number.
   *
   * A name is not unique, so this only finds candidates; the manager adds one of them below.
   */
  const handleSearchMembers = async (event: FormEvent, groupId: string) => {
    event.preventDefault();
    const query = (memberQueries[groupId] ?? "").trim();
    if (query.length < MIN_SEARCH_LENGTH) {
      setError(`برای جست‌وجو حداقل ${MIN_SEARCH_LENGTH} حرف وارد کنید.`);
      setSuccess(null);
      return;
    }
    setBusy(`search-${groupId}`);
    setError(null);
    try {
      const found = await searchGroupMemberCandidates(groupId, query);
      setMemberMatches((current) => ({ ...current, [groupId]: found }));
    } catch (err) {
      showFailure(err, "خطا در جست‌وجوی کاربر");
    } finally {
      setBusy(null);
    }
  };

  const handleAddMember = async (
    groupId: string,
    candidate: GroupMemberCandidate,
  ) => {
    setBusy(`member-${candidate.id}`);
    setError(null);
    try {
      const group = await addGroupMember(groupId, { userId: candidate.id });
      setGroups((current) =>
        current.map((item) => (item.id === group.id ? group : item)),
      );
      // Keep the result in place, now marked as a member: the manager sees what happened to the
      // row they clicked instead of watching it vanish.
      setMemberMatches((current) => ({
        ...current,
        [groupId]: (current[groupId] ?? []).map((item) =>
          item.id === candidate.id ? { ...item, alreadyMember: true } : item,
        ),
      }));
      setSuccess("عضو به گروه اضافه شد.");
    } catch (err) {
      showFailure(err, "خطا در افزودن عضو");
    } finally {
      setBusy(null);
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    setBusy(`remove-${userId}`);
    setError(null);
    try {
      const group = await removeGroupMember(groupId, userId);
      setGroups((current) =>
        current.map((item) => (item.id === group.id ? group : item)),
      );
      setSuccess("عضو از گروه حذف شد.");
    } catch (err) {
      showFailure(err, "خطا در حذف عضو");
    } finally {
      setBusy(null);
    }
  };

  const handleSubmitMessage = async (event: FormEvent, group: ManagedGroup) => {
    event.preventDefault();
    setBusy(`message-${group.id}`);
    setError(null);
    try {
      const result = await submitGroupMessage(
        group.id,
        messageDrafts[group.id] ?? "",
      );
      setMessageDrafts((current) => ({ ...current, [group.id]: "" }));
      setSuccess(`پیام برای ${result.recipientCount} عضو در صف ارسال مدیر قرار گرفت.`);
    } catch (err) {
      showFailure(err, "خطا در ثبت پیام گروهی");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-800">گروه‌های من</h1>
        <p className="mt-1 text-sm text-gray-500">
          گروه بسازید، اعضا را با شماره تلفن یا نام اضافه کنید و برای همه یک پیام ثبت کنید.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="mb-4 rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700">
          {success}
        </div>
      )}

      <form onSubmit={handleCreate} className="mb-6 flex flex-col gap-3 rounded-xl border border-primary-100 bg-white p-5 sm:flex-row">
        <input
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          maxLength={100}
          required
          placeholder="نام گروه"
          aria-label="نام گروه جدید"
          className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy === "create"}
          className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60"
        >
          {busy === "create" ? "در حال ایجاد…" : "ایجاد گروه"}
        </button>
      </form>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500">در حال بارگذاری گروه‌ها…</p>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-primary-100 bg-white p-8 text-center text-sm text-gray-500">
          هنوز در گروهی عضو نیستید. با ایجاد اولین گروه، مدیر آن خواهید بود.
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const isManager = group.managerId === user?.id;
            return (
              <section key={group.id} className="rounded-xl border border-primary-100 bg-white p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-primary-800">{group.name}</h2>
                    <p className="text-xs text-gray-500">
                      مدیر گروه: {group.managerName} · {group.members.length} عضو
                    </p>
                  </div>
                  {!isManager && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">عضو گروه</span>
                  )}
                </div>

                <ul className="mb-4 divide-y divide-primary-50">
                  {group.members.map((member) => (
                    <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-800">{member.fullName || member.username}</span>
                        <span className="ms-2 font-mono text-xs text-gray-500" dir="ltr">{member.phone}</span>
                      </div>
                      {isManager && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(group.id, member.id)}
                          disabled={busy === `remove-${member.id}`}
                          className="text-xs text-error-600 hover:text-error-800 disabled:opacity-50"
                        >
                          حذف عضو
                        </button>
                      )}
                    </li>
                  ))}
                  {group.members.length === 0 && (
                    <li className="py-3 text-sm text-gray-500">هنوز عضوی به گروه اضافه نشده است.</li>
                  )}
                </ul>

                {isManager && (
                  <>
                    {/* Add a member: a name or a phone number finds the account, then one row of
                        the results is added. A name is not unique, so the manager picks. */}
                    <form
                      onSubmit={(event) => handleSearchMembers(event, group.id)}
                      className="mb-3 flex flex-col gap-2 sm:flex-row"
                    >
                      <input
                        value={memberQueries[group.id] ?? ""}
                        onChange={(event) =>
                          setMemberQueries((current) => ({
                            ...current,
                            [group.id]: event.target.value,
                          }))
                        }
                        required
                        maxLength={60}
                        placeholder="شماره تلفن یا نام کاربر"
                        aria-label={`جست‌وجوی کاربر برای گروه ${group.name}`}
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={busy === `search-${group.id}`}
                        className="rounded-lg border border-primary-300 px-4 py-2 text-sm font-medium text-primary-800 hover:bg-primary-50 disabled:opacity-60"
                      >
                        {busy === `search-${group.id}` ? "در حال جست‌وجو…" : "جست‌وجو"}
                      </button>
                    </form>

                    {memberMatches[group.id] && (
                      <div className="mb-5 rounded-lg border border-primary-100 bg-primary-50/40 p-3">
                        {memberMatches[group.id].length === 0 ? (
                          <p className="text-xs text-gray-500">
                            کاربری با این مشخصات پیدا نشد.
                          </p>
                        ) : (
                          <ul className="divide-y divide-primary-100">
                            {memberMatches[group.id].map((candidate) => (
                              <li
                                key={candidate.id}
                                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                              >
                                <div className="min-w-0">
                                  <span className="font-medium text-gray-800">
                                    {candidate.fullName || candidate.username}
                                  </span>
                                  <span
                                    className="ms-2 font-mono text-xs text-gray-500"
                                    dir="ltr"
                                  >
                                    {candidate.username}
                                  </span>
                                  {candidate.phoneHint && (
                                    <span
                                      className="ms-2 font-mono text-xs text-gray-400"
                                      dir="ltr"
                                      title="چهار رقم آخر شماره تلفن"
                                    >
                                      ••••{candidate.phoneHint}
                                    </span>
                                  )}
                                </div>
                                {candidate.alreadyMember ? (
                                  <span className="text-xs text-success-700">
                                    عضو گروه است
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAddMember(group.id, candidate)
                                    }
                                    disabled={busy === `member-${candidate.id}`}
                                    className="text-xs font-medium text-primary-700 hover:text-primary-900 disabled:opacity-50"
                                  >
                                    {busy === `member-${candidate.id}`
                                      ? "در حال افزودن…"
                                      : "افزودن عضو"}
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <form onSubmit={(event) => handleSubmitMessage(event, group)}>
                      <label htmlFor={`message-${group.id}`} className="mb-2 block text-sm font-semibold text-gray-700">
                        پیام برای همه اعضا
                      </label>
                      <textarea
                        id={`message-${group.id}`}
                        value={messageDrafts[group.id] ?? ""}
                        onChange={(event) => setMessageDrafts((current) => ({ ...current, [group.id]: event.target.value }))}
                        required
                        maxLength={5000}
                        rows={4}
                        placeholder="متن پیام را بنویسید…"
                        className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={busy === `message-${group.id}` || group.members.length === 0}
                        className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy === `message-${group.id}` ? "در حال ثبت…" : "ثبت پیام برای اعضا"}
                      </button>
                      {group.members.some((member) => !member.phone) && (
                        <p className="mt-2 text-xs text-warning-700">برای ارسال، شماره تلفن همه اعضا باید در حسابشان ثبت شده باشد.</p>
                      )}
                    </form>
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
