// src/components/PageHeader.tsx
interface Props {
    title: string;
    subtitle?: string;
}

/**
 * Page title block for the public pages.
 *
 * A short accent rule under the title instead of a full-width bottom border: the border
 * competed with the card edges directly below it, while the rule reads as a deliberate
 * heading marker and leaves the page feeling less boxed in.
 */
export default function PageHeader({ title, subtitle }: Props) {
    return (
        <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-primary-900 sm:text-3xl">
                {title}
            </h1>
            <span
                aria-hidden="true"
                className="mt-3 block h-1 w-14 rounded-full bg-gradient-to-l from-primary-400 to-primary-700"
            />
            {subtitle && (
                <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-500 sm:text-base">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
