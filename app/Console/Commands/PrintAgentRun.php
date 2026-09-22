<?php

namespace App\Console\Commands;

use App\Services\ReceiptPrinterService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PrintAgentRun extends Command
{
    protected $signature = 'print-agent:run {--once} {--interval=}';

    protected $description = 'Poll the production site for pending print jobs and print them on this LAN-connected machine';

    public function handle(ReceiptPrinterService $printerService): int
    {
        $once = (bool) $this->option('once');
        $baseInterval = (int) ($this->option('interval') ?: config('print_agent.poll_interval'));
        $backoff = $baseInterval;

        do {
            try {
                $response = Http::withHeaders([
                    'X-Print-Agent-Token' => config('print_agent.token'),
                ])
                    ->baseUrl(config('print_agent.base_url'))
                    ->timeout(5)
                    ->post('/api/print-agent/jobs/claim', [
                        'limit' => config('print_agent.claim_limit'),
                    ]);

                if (! $response->successful()) {
                    $this->warn("Claim request failed with status {$response->status()}.");
                    Log::warning('print-agent: claim request failed', ['status' => $response->status()]);

                    $backoff = min($backoff * 2, 60);
                } else {
                    $backoff = $baseInterval;

                    $jobs = $response->json() ?? [];

                    foreach ($jobs as $job) {
                        $this->processJob($printerService, $job);
                    }
                }
            } catch (\Throwable $e) {
                $this->warn('Claim request threw an exception: '.$e->getMessage());
                Log::warning('print-agent: claim request exception', ['message' => $e->getMessage()]);

                $backoff = min($backoff * 2, 60);
            }

            if (! $once) {
                sleep($backoff);
            }
        } while (! $once);

        return self::SUCCESS;
    }

    /**
     * Prints one job and reports the result — isolated in its own
     * try/catch so a single bad job (bad payload, printer error, etc.)
     * can never crash the polling loop or skip reporting a result back.
     */
    private function processJob(ReceiptPrinterService $printerService, array $job): void
    {
        $pjId = $job['pj_id'] ?? null;
        $success = false;
        $error = null;

        try {
            $success = $printerService->printFromPayload(
                $job['pj_printer'] ?? '',
                $job['pj_type'] ?? '',
                $job['pj_payload'] ?? []
            );

            if (! $success) {
                $error = 'Print failed — see server logs for the printer-side reason.';
            }
        } catch (\Throwable $e) {
            $success = false;
            $error = $e->getMessage();
        }

        if ($pjId === null) {
            $this->warn('Job returned by claim had no pj_id, skipping result report.');

            return;
        }

        try {
            Http::withHeaders([
                'X-Print-Agent-Token' => config('print_agent.token'),
            ])
                ->baseUrl(config('print_agent.base_url'))
                ->timeout(5)
                ->post("/api/print-agent/jobs/{$pjId}/result", [
                    'status' => $success ? 'success' : 'failed',
                    'error' => $error,
                ]);
        } catch (\Throwable $e) {
            $this->warn("Failed to report result for job {$pjId}: ".$e->getMessage());
            Log::warning('print-agent: result report exception', ['pj_id' => $pjId, 'message' => $e->getMessage()]);
        }
    }
}
