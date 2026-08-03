import { useState } from "react";
import { router } from "@inertiajs/react";

export default function RejectModal({ open, onClose, actionUrl, title }) {
    const [remarks, setRemarks] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!open) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(
            actionUrl,
            { approval_remarks: remarks },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSubmitting(false);
                    setRemarks("");
                    onClose();
                },
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
                <h3 className="text-lg font-semibold mb-3">{title}</h3>
                <form onSubmit={handleSubmit}>
                    <label className="block text-sm font-medium mb-1">
                        Reason for rejection
                    </label>
                    <textarea
                        className="w-full border rounded-md p-2 text-sm"
                        rows={3}
                        required
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-md text-sm border"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white disabled:opacity-50"
                        >
                            {submitting ? "Rejecting..." : "Reject"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
