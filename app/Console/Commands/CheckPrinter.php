<?php

namespace App\Console\Commands;

use App\Services\ReceiptPrinterService;
use Illuminate\Console\Command;

class CheckPrinter extends Command
{
    protected $signature = 'printer:check {name=kitchen}';
    protected $description = 'Check whether a configured printer is reachable';

    public function handle(ReceiptPrinterService $service): void
    {
        $name = $this->argument('name');
        $connected = $service->isPrinterConnected($name);

        if ($connected) {
            $this->info("Printer '{$name}' is CONNECTED ✅");
        } else {
            $this->error("Printer '{$name}' is NOT REACHABLE ❌");
        }
    }
}