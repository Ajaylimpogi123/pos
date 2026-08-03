<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItems;
use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Illuminate\Support\Facades\Log;

class ReceiptPrinterService
{
    /**
     * Print the full receipt to a single named printer (defaults to the
     * 'default' profile in config/printer.php — typically the cashier
     * printer). Never throws — logs a warning and returns false if that
     * printer isn't reachable.
     */
    public function printReceipt(Order $order, ?string $printerName = null): bool
    {
        $printerName ??= config('printer.default');

        return $this->printItemsTo($printerName, $order, $order->items);
    }

    /**
     * Splits the order's items across printers according to
     * config('printer.category_routing') (cat_id => printer name) and
     * sends each group as its own ticket — e.g. food items to the
     * kitchen printer, drinks to the bar printer. Items whose category
     * isn't mapped fall back to the default printer.
     */
    public function printByCategory(Order $order): array
    {
        $routing = config('printer.category_routing', []);
        $groups = [];

        foreach ($order->items as $item) {
            $catId = $item->products->cat_id ?? null;
            $printerName = $routing[$catId] ?? config('printer.default');
            $groups[$printerName][] = $item;
        }

        $results = [];
        foreach ($groups as $printerName => $items) {
            $results[$printerName] = $this->printItemsTo($printerName, $order, collect($items));
        }

        return $results;
    }

    /**
     * Check whether a specific named printer is currently reachable,
     * without printing anything.
     */
    public function isPrinterConnected(string $printerName): bool
    {
        return $this->resolveConnector($printerName) !== null;
    }

    private function printItemsTo(string $printerName, Order $order, $items): bool
    {
        $profile = config("printer.printers.{$printerName}");

        if (!$profile || !($profile['enabled'] ?? false)) {
            return false;
        }

        $connector = $this->resolveConnector($printerName);

        if (!$connector) {
            Log::warning("Printer '{$printerName}' not reachable, skipping print.", [
                'od_id' => $order->od_id,
            ]);
            return false;
        }

        try {
            $printer = new Printer($connector);
            $this->buildReceipt($printer, $order, $items, $printerName);
            $printer->close();
            return true;
        } catch (\Exception $e) {
            Log::error("Print to '{$printerName}' failed: " . $e->getMessage(), [
                'od_id' => $order->od_id,
            ]);
            return false;
        }
    }

    private function resolveConnector(string $printerName)
    {
        $profile = config("printer.printers.{$printerName}");

        if (!$profile) {
            return null;
        }

        return match ($profile['method']) {
            'com' => $this->resolveComConnector($profile),
            'network' => $this->resolveNetworkConnector($profile),
            default => null,
        };
    }

    private function resolveComConnector(array $profile): ?FilePrintConnector
    {
        $port = $profile['com_port'];
        $baud = $profile['com_baud'] ?? 9600;

        // Configure serial settings before opening — Windows won't do
        // this automatically, and a mismatch is the #1 cause of
        // garbled or silent COM-port printing.
        @exec("mode {$port}: baud={$baud} parity=N data=8 stop=1");

        try {
            return new FilePrintConnector($port);
        } catch (\Exception $e) {
            return null;
        }
    }

    private function resolveNetworkConnector(array $profile): ?NetworkPrintConnector
    {
        $ip = $profile['network_ip'];
        $port = $profile['network_port'];
        $timeout = config('printer.connect_timeout', 2);

        $socket = @fsockopen($ip, $port, $errno, $errstr, $timeout);

        if (!$socket) {
            return null;
        }

        fclose($socket);

        try {
            return new NetworkPrintConnector($ip, $port);
        } catch (\Exception $e) {
            return null;
        }
    }

    private function buildReceipt(Printer $printer, Order $order, $items, string $printerName): void
    {
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->text(config('printer.store_name') . "\n");
        $printer->setEmphasis(false);

        // Label kitchen/bar tickets so staff know what station it's for
        if ($printerName !== config('printer.default')) {
            $printer->setEmphasis(true);
            $printer->text(strtoupper($printerName) . " TICKET\n");
            $printer->setEmphasis(false);
        }

        $printer->text("Table {$order->table_number}\n");
        $printer->text("Invoice: {$order->invoice_no}\n");
        $printer->text($order->created_at->format('Y-m-d H:i') . "\n");
        $printer->text(str_repeat('-', 32) . "\n");

        $printer->setJustification(Printer::JUSTIFY_LEFT);

        foreach ($items as $item) {
            $name = $item->products->pd_name ?? 'Item';
            $qty = $item->oi_qty;
            $price = number_format($item->oi_price, 2);
            $lineTotal = number_format($item->oi_price * $qty, 2);

            $printer->text(sprintf("%-20s %2d x %6s\n", $name, $qty, $price));
            $printer->setJustification(Printer::JUSTIFY_RIGHT);
            $printer->text("P{$lineTotal}\n");
            $printer->setJustification(Printer::JUSTIFY_LEFT);
        }

        // Only show totals/payment on the default (cashier) receipt —
        // kitchen/bar tickets don't need pricing info
        if ($printerName === config('printer.default')) {
            $printer->text(str_repeat('-', 32) . "\n");
            $printer->setJustification(Printer::JUSTIFY_RIGHT);
            $printer->setEmphasis(true);
            $printer->text("TOTAL: P" . number_format($order->od_total_amt_due, 2) . "\n");
            $printer->setEmphasis(false);
            $printer->text("Paid ({$order->payment_method}): P" . number_format($order->od_payment, 2) . "\n");
            $printer->text("Change: P" . number_format($order->od_change, 2) . "\n");
        }

        $printer->feed(2);
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->text("Thank you!\n");
        $printer->feed(3);
        $printer->cut();
    }
}