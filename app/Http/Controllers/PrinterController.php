<?php

namespace App\Http\Controllers;

use App\Services\PrintJobService;
use App\Services\ReceiptPrinterService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PrinterController extends Controller
{
    public function index()
    {
        $printers = collect(config('printer.printers'))
            ->map(fn ($profile, $name) => [
                'name' => $name,
                'enabled' => $profile['enabled'],
                'method' => $profile['method'],
            ])
            ->values();

        return Inertia::render('Printer/Index', [
            'printers' => $printers,
        ]);
    }

    public function test(Request $request, string $name)
    {
        if (! in_array($name, array_keys(config('printer.printers')), true)) {
            return redirect()->back()->with('error', "Unknown printer '{$name}'.");
        }

        if (config('printer.mode') === 'direct') {
            $connected = app(ReceiptPrinterService::class)->isPrinterConnected($name);

            return redirect()->back()->with(
                $connected ? 'success' : 'error',
                $connected ? "Printer '{$name}' is connected." : "Printer '{$name}' is not reachable."
            );
        }

        $job = app(PrintJobService::class)->enqueueTest($name, auth()->id());

        return redirect()->back()
            ->with('success', "Test print queued for '{$name}'.")
            ->with('print_jobs', [$job->pj_id]);
    }
}
