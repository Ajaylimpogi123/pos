export default function LogsTab({ logs }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left border-b bg-gray-50">
                        <th className="p-2">Date/Time</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Reference #</th>
                        <th className="p-2">Action</th>
                        <th className="p-2">By</th>
                        <th className="p-2">Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.length === 0 && (
                        <tr>
                            <td
                                colSpan={6}
                                className="text-center text-gray-400 py-6"
                            >
                                No activity yet.
                            </td>
                        </tr>
                    )}

                    {logs.map((log, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="p-2">{log.at}</td>
                            <td className="p-2">
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                        log.type === "PR"
                                            ? "bg-cyan-100 text-cyan-800"
                                            : "bg-indigo-100 text-indigo-800"
                                    }`}
                                >
                                    {log.type}
                                </span>
                            </td>
                            <td className="p-2">{log.reference}</td>
                            <td className="p-2">{log.action}</td>
                            <td className="p-2">{log.by ?? "—"}</td>
                            <td className="p-2">{log.remarks ?? "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
