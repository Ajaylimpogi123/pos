import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { Card, CardContent } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Printer as PrinterIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Index({ printers = [] }) {
    const [testingPrinter, setTestingPrinter] = useState(null);

    const handleTestPrint = (name) => {
        setTestingPrinter(name);

        router.post(
            route("printer.test", name),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const flash = page.props.flash;
                    if (flash?.error) {
                        toast.error(flash.error);
                    } else if (flash?.success) {
                        toast.success(flash.success);
                    }
                },
                onError: (errors) => {
                    const msg =
                        Object.values(errors)[0] || "Failed to test printer";
                    toast.error(msg);
                },
                onFinish: () => setTestingPrinter(null),
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Printers" />

            <div className="relative z-10 py-8">
                <div className="flex-1 space-y-6 p-4 md:p-6">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Printers
                        </h1>
                        <p className="mt-2 text-sm text-white">
                            Check connectivity or send a test ticket to a
                            configured receipt printer.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {printers.map((printer) => (
                            <Card key={printer.name}>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <PrinterIcon className="h-5 w-5 text-gray-500" />
                                            <span className="font-medium capitalize">
                                                {printer.name}
                                            </span>
                                        </div>
                                        <Badge
                                            variant={
                                                printer.enabled
                                                    ? "default"
                                                    : "secondary"
                                            }
                                        >
                                            {printer.enabled
                                                ? "Enabled"
                                                : "Disabled"}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-gray-500">
                                        Method:{" "}
                                        <span className="uppercase">
                                            {printer.method}
                                        </span>
                                    </p>

                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        disabled={
                                            !printer.enabled ||
                                            testingPrinter === printer.name
                                        }
                                        onClick={() =>
                                            handleTestPrint(printer.name)
                                        }
                                    >
                                        {testingPrinter === printer.name
                                            ? "Testing..."
                                            : "Test Print"}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}

                        {printers.length === 0 && (
                            <p className="text-center text-gray-400 py-8 col-span-full">
                                No printers configured.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
