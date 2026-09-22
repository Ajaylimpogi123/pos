<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PrintJob;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PrintJobService
{
    public function __construct(
        private readonly PrintJobPayloadBuilder $payloadBuilder
    ) {}

    /**
     * Queue the customer receipt for a just-placed order.
     */
    public function enqueueReceipt(Order $order, ?string $printerName = null, bool $manual = false): PrintJob
    {
        return PrintJob::create([
            'pj_type' => 'receipt',
            'pj_printer' => $printerName ?? config('printer.default'),
            'od_id' => $order->od_id,
            'pj_payload' => $this->payloadBuilder->forReceipt($order),
            'pj_status' => 'pending',
            'pj_is_manual' => $manual,
        ]);
    }

    /**
     * Groups $unprintedRows by target printer using the exact same
     * config('printer.category_routing') logic ReceiptPrinterService's
     * kitchen-preview path uses (unmapped categories default to 'kitchen'),
     * and creates one PrintJob per target printer group.
     *
     * @param  array  $unprintedRows  [['pd_id', 'pd_name', 'ct_qty' (unprinted qty),
     *                                'cat_id', 'ct_id'], ...]
     * @return Collection<int, PrintJob>
     */
    public function enqueueKitchen(array $unprintedRows, string $ticketTag): Collection
    {
        $routing = config('printer.category_routing', []);
        $groups = [];

        foreach ($unprintedRows as $row) {
            $target = $routing[$row['cat_id'] ?? null] ?? 'kitchen';
            $groups[$target][] = $row;
        }

        $jobs = collect();

        foreach ($groups as $printerName => $rows) {
            $jobs->push(PrintJob::create([
                'pj_type' => 'kitchen',
                'pj_printer' => $printerName,
                'pj_payload' => $this->payloadBuilder->forKitchen($rows, $ticketTag),
                'pj_status' => 'pending',
            ]));
        }

        return $jobs;
    }

    public function enqueueTest(string $printerName, ?int $userId): PrintJob
    {
        return PrintJob::create([
            'pj_type' => 'test',
            'pj_printer' => $printerName,
            'pj_payload' => [],
            'pj_status' => 'pending',
            'pj_is_manual' => true,
            'user_id' => $userId,
        ]);
    }

    /**
     * Claims up to $limit jobs for the polling agent: pending jobs, plus
     * claimed jobs that have gone stale (agent likely crashed mid-print)
     * and haven't hit pj_max_attempts yet. Stale-claimed jobs that HAVE
     * hit pj_max_attempts are flipped straight to 'failed' instead of
     * being handed out again.
     *
     * @return Collection<int, PrintJob>
     */
    public function claimNext(int $limit): Collection
    {
        return DB::transaction(function () use ($limit) {
            $staleCutoff = now()->subMinutes(config('print_agent.stale_claim_minutes'));

            // Stale claims that have exhausted their attempts: give up on them.
            PrintJob::where('pj_status', 'claimed')
                ->where('pj_claimed_at', '<', $staleCutoff)
                ->whereColumn('pj_attempts', '>=', 'pj_max_attempts')
                ->update([
                    'pj_status' => 'failed',
                    'pj_error' => 'Print agent claim went stale without reporting a result.',
                    'pj_completed_at' => now(),
                ]);

            $jobs = PrintJob::where(function ($query) use ($staleCutoff) {
                $query->where('pj_status', 'pending')
                    ->orWhere(function ($query) use ($staleCutoff) {
                        $query->where('pj_status', 'claimed')
                            ->where('pj_claimed_at', '<', $staleCutoff)
                            ->whereColumn('pj_attempts', '<', 'pj_max_attempts');
                    });
            })
                ->lockForUpdate()
                ->limit($limit)
                ->get();

            if ($jobs->isEmpty()) {
                return $jobs;
            }

            PrintJob::whereIn('pj_id', $jobs->pluck('pj_id'))->update([
                'pj_status' => 'claimed',
                'pj_attempts' => DB::raw('pj_attempts + 1'),
                'pj_claimed_at' => now(),
            ]);

            return $jobs->fresh();
        });
    }

    /**
     * Records the agent's report for a claimed job. A failure that hasn't
     * exhausted pj_max_attempts is put back to 'pending' for another
     * claim/retry cycle; otherwise the job is terminally 'failed'.
     */
    public function reportResult(PrintJob $job, bool $success, ?string $error = null): void
    {
        if ($success) {
            $job->update([
                'pj_status' => 'success',
                'pj_error' => null,
                'pj_completed_at' => now(),
            ]);

            if ($job->pj_type === 'kitchen') {
                $this->markCartRowsPrinted($job);
            }

            return;
        }

        $willRetry = $job->pj_attempts < $job->pj_max_attempts;

        $job->update([
            'pj_status' => $willRetry ? 'pending' : 'failed',
            'pj_error' => $error,
            'pj_completed_at' => $willRetry ? null : now(),
        ]);
    }

    /**
     * Increments (never overwrites) ct_printed_qty by the exact quantity
     * snapshotted in the job payload. An absolute set (the old synchronous
     * OrderController::printKitchen() behavior) would be wrong here: once
     * printing is async, a customer can add more of the same item to a
     * cart row between job creation and this callback, and an absolute
     * set would wrongly mark those newer additions as already printed.
     */
    public function markCartRowsPrinted(PrintJob $job): void
    {
        foreach ($job->pj_payload['cart_snapshot'] ?? [] as $row) {
            DB::table('tbl_cart')
                ->where('ct_id', $row['ct_id'])
                ->increment('ct_printed_qty', $row['qty']);
        }
    }

    /**
     * Resets a failed job in place for a "Retry Print" UI action — distinct
     * from "Print Again", which always creates a brand new job.
     */
    public function retry(PrintJob $job): PrintJob
    {
        $job->update([
            'pj_status' => 'pending',
            'pj_attempts' => 0,
            'pj_error' => null,
        ]);

        return $job;
    }
}
