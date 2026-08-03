const COLORS = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-600",
    converted: "bg-blue-100 text-blue-800",
    partially_received: "bg-cyan-100 text-cyan-800",
    received: "bg-green-100 text-green-800",
    closed: "bg-slate-200 text-slate-700",
};

function toLabel(status) {
    return status
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export default function StatusBadge({ status }) {
    const colorClass = COLORS[status] ?? "bg-gray-100 text-gray-600";

    return (
        <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
        >
            {toLabel(status)}
        </span>
    );
}
