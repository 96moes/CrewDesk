// src/components/PageHeader.tsx
interface Props {
    title: string;
    subtitle?: string;
}

export default function PageHeader({ title, subtitle }: Props) {
    return (
        <div className="mb-8 border-b border-primary-100 pb-6">
            <h1 className="text-3xl font-bold text-primary-800">{title}</h1>
            {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
        </div>
    );
}