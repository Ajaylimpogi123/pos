<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItems;
use Illuminate\Support\Facades\Log;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\Printer;

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
     * Print a kitchen/bar ticket from raw cart item data — before any
     * Order/OrderItems rows exist. Used for:
     *  - MenuController::store()  -> single item, the instant it's added to cart
     *  - OrderController::printKitchen() -> whole cart, from the checkout modal button
     *
     * @param  array  $items  [['pd_id' => int, 'pd_name' => string, 'ct_qty' => int, 'cat_id' => int|null], ...]
     * @param  bool  $routeByCategory  If true, splits items across printers using
     *                                 config('printer.category_routing') — each
     *                                 item array needs a 'cat_id'. If false,
     *                                 everything goes to one printer.
     * @param  string|null  $printerName  Printer profile to use when $routeByCategory
     *                                    is false. Defaults to 'kitchen'.
     * @return array<string,bool> Map of printer name => success.
     */
    public function printKitchenPreview(
        array $items,
        string $tableNumber,
        bool $routeByCategory = false,
        ?string $printerName = null
    ): array {
        if (! $routeByCategory) {
            $printerName ??= 'kitchen';

            return [$printerName => $this->printKitchenPreviewTo($printerName, $items, $tableNumber)];
        }

        $routing = config('printer.category_routing', []);
        $groups = [];

        foreach ($items as $item) {
            $catId = $item['cat_id'] ?? null;
            $target = $routing[$catId] ?? 'kitchen';
            $groups[$target][] = $item;
        }

        $results = [];
        foreach ($groups as $target => $groupItems) {
            $results[$target] = $this->printKitchenPreviewTo($target, $groupItems, $tableNumber);
        }

        return $results;
    }

    /**
     * Check whether a specific named printer is currently reachable,
     * without printing anything. Explicitly finalizes the connector
     * after the check — since we're not printing, nothing else will
     * close it, and leaving it open triggers a "did you forget to
     * close the printer?" notice when PHP garbage-collects it.
     */
    public function isPrinterConnected(string $printerName): bool
    {
        $connector = $this->resolveConnector($printerName);

        if (! $connector) {
            return false;
        }

        try {
            $connector->finalize();
        } catch (\Exception $e) {
            // Already got a successful connection — a finalize hiccup here
            // doesn't change the reachability result, just log it.
            Log::warning("Connector finalize warning for '{$printerName}': ".$e->getMessage());
        }

        return true;
    }

    private function printItemsTo(string $printerName, Order $order, $items): bool
    {
        $profile = config("printer.printers.{$printerName}");

        if (! $profile || ! ($profile['enabled'] ?? false)) {
            return false;
        }

        $connector = $this->resolveConnector($printerName);

        if (! $connector) {
            Log::warning("Printer '{$printerName}' not reachable, skipping print.", [
                'od_id' => $order->od_id,
            ]);

            return false;
        }

        try {
            $header = [
                'store_name' => config('printer.store_name'),
                'invoice_no' => $order->invoice_no,
                'created_at' => $order->created_at->format('Y-m-d H:i'),
                'total' => (float) $order->od_total_amt_due,
                'payment_method' => $order->payment_method,
                'payment' => (float) $order->od_payment,
                'change' => (float) $order->od_change,
            ];

            $itemsArray = collect($items)->map(fn ($item) => [
                'name' => $item->products->pd_name ?? 'Item',
                'qty' => $item->oi_qty,
                'price' => (float) $item->oi_price,
            ])->all();

            $printer = new Printer($connector);
            $this->buildReceipt($printer, $header, $itemsArray, $printerName);
            $printer->close();

            return true;
        } catch (\Exception $e) {
            Log::error("Print to '{$printerName}' failed: ".$e->getMessage(), [
                'od_id' => $order->od_id,
            ]);

            return false;
        }
    }

    private function printKitchenPreviewTo(string $printerName, array $items, string $tableNumber): bool
    {
        $profile = config("printer.printers.{$printerName}");

        if (! $profile) {
            Log::warning("Printer '{$printerName}' has no config entry in printer.php.", [
                'table_number' => $tableNumber,
            ]);

            return false;
        }

        if (! ($profile['enabled'] ?? false)) {
            Log::warning("Printer '{$printerName}' is disabled (enabled=false in config/.env).", [
                'table_number' => $tableNumber,
            ]);

            return false;
        }

        $connector = $this->resolveConnector($printerName);

        if (! $connector) {
            Log::warning("Printer '{$printerName}' unreachable — check IP/port and that it's powered on.", [
                'table_number' => $tableNumber,
                'method' => $profile['method'] ?? 'unknown',
                'network_ip' => $profile['network_ip'] ?? null,
                'network_port' => $profile['network_port'] ?? null,
            ]);

            return false;
        }

        try {
            $printer = new Printer($connector);
            $this->buildKitchenTicket($printer, $items, $tableNumber, $printerName);
            $printer->close();

            return true;
        } catch (\Exception $e) {
            Log::error("Kitchen print to '{$printerName}' failed mid-print: ".$e->getMessage(), [
                'table_number' => $tableNumber,
            ]);

            return false;
        }
    }

    private function resolveConnector(string $printerName)
    {
        $profile = config("printer.printers.{$printerName}");

        if (! $profile) {
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

        if (! $socket) {
            return null;
        }

        fclose($socket);

        try {
            return new NetworkPrintConnector($ip, $port);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * @param  array  $header  Keys: store_name, invoice_no, created_at, total,
     *                         payment_method, payment, change.
     * @param  array  $items  List of ['name' => string, 'qty' => int, 'price' => float].
     */
    private function buildReceipt(Printer $printer, array $header, array $items, string $printerName): void
    {
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->text($header['store_name']."\n");
        $printer->setEmphasis(false);

        if ($printerName !== config('printer.default')) {
            $printer->setEmphasis(true);
            $printer->text(strtoupper($printerName)." TICKET\n");
            $printer->setEmphasis(false);
        }

        $printer->text("Invoice: {$header['invoice_no']}\n");
        $printer->text($header['created_at']."\n");
        $printer->text(str_repeat('-', 32)."\n");

        $printer->setJustification(Printer::JUSTIFY_LEFT);

        foreach ($items as $item) {
            $name = $item['name'] ?? 'Item';
            $qty = $item['qty'];
            $price = number_format($item['price'], 2);
            $lineTotal = number_format($item['price'] * $qty, 2);

            $printer->text(sprintf("%-20s %2d x %6s\n", $name, $qty, $price));
            $printer->setJustification(Printer::JUSTIFY_RIGHT);
            $printer->text("P{$lineTotal}\n");
            $printer->setJustification(Printer::JUSTIFY_LEFT);
        }

        if ($printerName === config('printer.default')) {
            $printer->text(str_repeat('-', 32)."\n");
            $printer->setJustification(Printer::JUSTIFY_RIGHT);
            $printer->setEmphasis(true);
            $printer->text('TOTAL: P'.number_format($header['total'], 2)."\n");
            $printer->setEmphasis(false);
            $printer->text("Paid ({$header['payment_method']}): P".number_format($header['payment'], 2)."\n");
            $printer->text('Change: P'.number_format($header['change'], 2)."\n");
        }

        $printer->feed(2);
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->text("Thank you!\n");
        $printer->feed(3);
        $printer->cut();
    }

    /**
     * Short connectivity/test ticket — used for the manual "Test Print"
     * button on the Printers admin page, both in direct mode and via the
     * queue/agent path (printFromPayload dispatches here for pj_type='test').
     */
    private function buildTestTicket(Printer $printer, string $printerName): void
    {
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->text("TEST PRINT\n");
        $printer->setEmphasis(false);
        $printer->text(strtoupper($printerName)."\n");
        $printer->text(now()->format('Y-m-d H:i:s')."\n");
        $printer->feed(3);
        $printer->cut();
    }

    /**
     * The only method the LAN print agent calls (via the /print-agent/jobs/*
     * API). Resolves the named printer exactly like the direct-print paths
     * do, then dispatches to the same ESC/POS-building code so output is
     * identical whether printing happened synchronously or via the queue.
     * Never throws — every failure is caught, logged, and surfaces as false.
     */
    public function printFromPayload(string $printerName, string $type, array $payload): bool
    {
        $profile = config("printer.printers.{$printerName}");

        if (! $profile || ! ($profile['enabled'] ?? false)) {
            Log::warning("Printer '{$printerName}' not enabled/configured, skipping queued print.", [
                'type' => $type,
            ]);

            return false;
        }

        $connector = $this->resolveConnector($printerName);

        if (! $connector) {
            Log::warning("Printer '{$printerName}' not reachable, skipping queued print.", [
                'type' => $type,
            ]);

            return false;
        }

        try {
            $printer = new Printer($connector);

            match ($type) {
                'receipt' => $this->buildReceipt($printer, $payload['header'] ?? [], $payload['items'] ?? [], $printerName),
                'kitchen' => $this->buildKitchenTicket($printer, $payload['items'] ?? [], $payload['ticket_tag'] ?? '', $printerName),
                'test' => $this->buildTestTicket($printer, $printerName),
                default => throw new \InvalidArgumentException("Unknown print job type '{$type}'."),
            };

            $printer->close();

            return true;
        } catch (\Exception $e) {
            Log::error("Queued print ('{$type}') to '{$printerName}' failed: ".$e->getMessage());

            return false;
        }
    }

    /**
     * Minimal ticket built from raw cart item data — no invoice number,
     * no totals, no payment info, just what to make and for which table.
     * Used both for whole-cart kitchen prints and single-item prints on add.
     */
    private function buildKitchenTicket(Printer $printer, array $items, string $tableNumber, string $printerName): void
    {
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->text(strtoupper($printerName)." TICKET\n");
        $printer->setEmphasis(false);

        $printer->text("Table {$tableNumber}\n");
        $printer->text(now()->format('Y-m-d H:i')."\n");
        $printer->text(str_repeat('-', 32)."\n");

        $printer->setJustification(Printer::JUSTIFY_LEFT);

        foreach ($items as $item) {
            $name = $item['pd_name'] ?? 'Item';
            $qty = $item['ct_qty'] ?? 1;

            $printer->text(sprintf("%-24s x%d\n", $name, $qty));
        }

        $printer->feed(3);
        $printer->cut();
    }
}
