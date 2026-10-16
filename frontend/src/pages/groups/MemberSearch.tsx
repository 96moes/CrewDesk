// src/pages/groups/MemberSearch.tsx
import { useState, type FormEvent } from "react";
import { useGroupsStore } from "../../stores/groupsStore";
import { apiErrorMessage } from "../../lib/apiError";
import { displayName } from "../../lib/displayName";
import {
    searchGroupMemberCandidates,
    type GroupMemberCandidate,
} from "../../api/groups";

/**
 * Adds a member to one group by name or by phone number.
 *
 * A name is not unique, so this searches and the manager picks: the account is added by id, which
 * cannot be ambiguous. The API returns a username and the last four digits of a phone number, never
 * a full number the manager did not already have, and it only answers for a group they manage.
 *
 * The query length matches the API's own minimum, so a too-short search is refused here instead of
 * costing a round trip.
 */
const MIN_SEARCH_LENGTH = 3;

interface Props {
    groupId: string;
    onNotice: (message: string) => void;
}

export default function MemberSearch({ groupId, onNotice }: Props) {
    const addMember = useGroupsStore((s) => s.addMember);

    const [query, setQuery] = useState("");
    /** undefined until a search has run, which is how "no results" differs from "not searched". */
    const [matches, setMatches] = useState<GroupMemberCandidate[] | undefined>();
    const [searching, setSearching] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const search = async (event: FormEvent) => {
        event.preventDefault();
        const term = query.trim();
        if (term.length < MIN_SEARCH_LENGTH) {
            setError(`برای جست‌وجو حداقل ${MIN_SEARCH_LENGTH} حرف وارد کنید.`);
            return;
        }

        setSearching(true);
        setError(null);
        try {
            setMatches(await searchGroupMemberCandidates(groupId, term));
        } catch (err) {
            setError(apiErrorMessage(err, "خطا در جست‌وجوی کاربر"));
        } finally {
            setSearching(false);
        }
    };

    const add = async (candidate: GroupMemberCandidate) => {
        setAddingId(candidate.id);
        setError(null);
        try {
            await addMember(groupId, { userId: candidate.id });
            // The row stays, marked as a member: the manager sees what happened to the result they
            // clicked instead of watching it vanish.
            setMatches((current) =>
                (current ?? []).map((item) =>
                    item.id === candidate.id
                        ? { ...item, alreadyMember: true }
                        : item,
                ),
            );
            onNotice(`${displayName(candidate)} به گروه اضافه شد.`);
        } catch (err) {
            setError(apiErrorMessage(err, "خطا در افزودن عضو"));
        } finally {
            setAddingId(null);
        }
    };

    return (
        <div className="mb-5">
            <form onSubmit={search} className="flex flex-col gap-2 sm:flex-row">
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    required
                    maxLength={60}
                    placeholder="شماره تلفن یا نام کاربر"
                    aria-label="جست‌وجوی کاربر برای افزودن به گروه"
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <button
                    type="submit"
                    disabled={searching}
                    className="rounded-lg border border-primary-300 px-4 py-2 text-sm font-medium text-primary-800 hover:bg-primary-50 disabled:opacity-60"
                >
                    {searching ? "در حال جست‌وجو…" : "جست‌وجو"}
                </button>
            </form>

            {error && (
                <div className="mt-2 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">
                    {error}
                </div>
            )}

            {matches && (
                <div className="mt-2 rounded-lg border border-primary-100 bg-primary-50/40 p-3">
                    {matches.length === 0 ? (
                        <p className="text-xs text-gray-500">
                            کاربری با این مشخصات پیدا نشد.
                        </p>
                    ) : (
                        <ul className="divide-y divide-primary-100">
                            {matches.map((candidate) => (
                                <li
                                    key={candidate.id}
                                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                                >
                                    <div className="min-w-0">
                                        <span className="font-medium text-gray-800">
                                            {displayName(candidate)}
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
                                            onClick={() => add(candidate)}
                                            disabled={addingId === candidate.id}
                                            className="text-xs font-medium text-primary-700 hover:text-primary-900 disabled:opacity-50"
                                        >
                                            {addingId === candidate.id
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
        </div>
    );
}
