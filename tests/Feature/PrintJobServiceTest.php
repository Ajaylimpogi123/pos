<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\PrintJob;
use App\Services\PrintJobPayloadBuilder;
use App\Services\PrintJobService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Uses DatabaseTransactions (never RefreshDatabase/DatabaseMigrations) because
 * phpunit.xml points at the real db_pos MySQL database — everything here
 * must roll back cleanly and never mutate real seeded rows.
 */
class PrintJobServiceTest extends TestCase
{
    use DatabaseTransactions;

    private function service(): PrintJobService
    {
        return app(PrintJobService::class);
    }

    private function makeOrder(): Order
    {
        $customer = Customer::firstOrCreate(
            ['cust_fname' => 'QA Print Job Customer'],
            ['cust_contact' => 'N/A']
        );

        return Order::create([
            'cust_id' => $customer->cust_id,
            'queue_no' => 1,
            'invoice_no' => 'INV-QA-'.uniqid(),
            'payment_method' => 'cash',
            'order_description' => 'QA test order',
            'od_amount_due' => 100,
            'od_discount' => 0,
            'percent_discount' => 0,
            'od_total_amt_due' => 100,
            'od_payment' => 100,
            'od_change' => 0,
            'other_charges' => 0,
            'is_open' => 0,
            'is_print' => 0,
            'od_remarks' => '',
        ]);
    }

    private function makeCartRow(int $ctQty = 3, int $ctPrintedQty = 0): int
    {
        return DB::table('tbl_cart')->insertGetId([
            'pd_id' => 1,
            'ct_qty' => $ctQty,
            'ct_printed_qty' => $ctPrintedQty,
            'ct_price' => 10,
            'remark' => '',
            'user_id' => 0,
            'merge_number' => 0,
            'is_done' => 0,
            'is_open' => 0,
            'is_print' => 0,
            'ct_status' => '',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    // ---------------------------------------------------------------
    // Job creation shape
    // ---------------------------------------------------------------

    public function test_enqueue_receipt_creates_pending_job_with_expected_payload_shape(): void
    {
        $order = $this->makeOrder();

        $job = $this->service()->enqueueReceipt($order);

        $this->assertSame('receipt', $job->pj_type);
        $this->assertSame('pending', $job->pj_status);
        $this->assertSame($order->od_id, $job->od_id);
        $this->assertArrayHasKey('header', $job->pj_payload);
        $this->assertArrayHasKey('items', $job->pj_payload);
        $this->assertSame($order->invoice_no, $job->pj_payload['header']['invoice_no']);
    }

    public function test_enqueue_kitchen_groups_rows_by_category_routing_matching_preview_logic(): void
    {
        config(['printer.category_routing' => [5 => 'bar']]);

        $rows = [
            ['pd_id' => 1, 'pd_name' => 'Soda', 'ct_qty' => 2, 'cat_id' => 5, 'ct_id' => 111],
            ['pd_id' => 2, 'pd_name' => 'Burger', 'ct_qty' => 1, 'cat_id' => 9, 'ct_id' => 222],
            ['pd_id' => 3, 'pd_name' => 'Fries', 'ct_qty' => 4, 'cat_id' => null, 'ct_id' => 333],
        ];

        $jobs = $this->service()->enqueueKitchen($rows, 'TKT-TEST');

        $byPrinter = $jobs->keyBy('pj_printer');

        $this->assertCount(2, $jobs, 'Expected one job for bar, one for kitchen (default).');
        $this->assertTrue($byPrinter->has('bar'));
        $this->assertTrue($byPrinter->has('kitchen'));

        $barItems = $byPrinter['bar']->pj_payload['items'];
        $this->assertCount(1, $barItems);
        $this->assertSame('Soda', $barItems[0]['pd_name']);

        $kitchenItems = $byPrinter['kitchen']->pj_payload['items'];
        $this->assertCount(2, $kitchenItems, 'Unmapped cat_id and non-routed cat_id both default to kitchen.');
    }

    public function test_enqueue_test_creates_manual_job_with_empty_payload(): void
    {
        $job = $this->service()->enqueueTest('cashier', 42);

        $this->assertSame('test', $job->pj_type);
        $this->assertSame('cashier', $job->pj_printer);
        $this->assertTrue($job->pj_is_manual);
        $this->assertSame(42, $job->user_id);
        $this->assertSame([], $job->pj_payload);
    }

    // ---------------------------------------------------------------
    // claimNext()
    // ---------------------------------------------------------------

    public function test_claim_next_does_not_hand_same_pending_job_to_two_sequential_calls(): void
    {
        $order = $this->makeOrder();
        $this->service()->enqueueReceipt($order);

        $first = $this->service()->claimNext(5);
        $this->assertCount(1, $first);
        $this->assertSame('claimed', $first->first()->fresh()->pj_status);

        $second = $this->service()->claimNext(5);
        $this->assertCount(0, $second, 'A job already claimed must not be handed out again.');
    }

    public function test_claim_next_reclaims_stale_claimed_job_under_max_attempts(): void
    {
        $order = $this->makeOrder();
        $job = $this->service()->enqueueReceipt($order);

        $job->update([
            'pj_status' => 'claimed',
            'pj_attempts' => 1,
            'pj_max_attempts' => 5,
            'pj_claimed_at' => now()->subMinutes(10),
        ]);

        $claimed = $this->service()->claimNext(5);

        $this->assertCount(1, $claimed, 'Stale claim under max attempts should be reclaimed.');
        $this->assertSame($job->pj_id, $claimed->first()->pj_id);
        $this->assertSame(2, $claimed->first()->pj_attempts, 'Reclaiming should increment attempts.');
    }

    public function test_claim_next_flips_stale_job_at_max_attempts_to_failed_instead_of_reclaiming(): void
    {
        $order = $this->makeOrder();
        $job = $this->service()->enqueueReceipt($order);

        $job->update([
            'pj_status' => 'claimed',
            'pj_attempts' => 5,
            'pj_max_attempts' => 5,
            'pj_claimed_at' => now()->subMinutes(10),
        ]);

        $claimed = $this->service()->claimNext(5);

        $this->assertCount(0, $claimed, 'A stale job that already exhausted attempts must not be handed out again.');

        $fresh = $job->fresh();
        $this->assertSame('failed', $fresh->pj_status);
        $this->assertNotNull($fresh->pj_completed_at);
    }

    public function test_claim_next_does_not_touch_fresh_claimed_job_still_within_stale_window(): void
    {
        $order = $this->makeOrder();
        $job = $this->service()->enqueueReceipt($order);

        $job->update([
            'pj_status' => 'claimed',
            'pj_attempts' => 1,
            'pj_claimed_at' => now(), // not stale
        ]);

        $claimed = $this->service()->claimNext(5);

        $this->assertCount(0, $claimed);
        $this->assertSame('claimed', $job->fresh()->pj_status);
    }

    // ---------------------------------------------------------------
    // reportResult()
    // ---------------------------------------------------------------

    public function test_report_result_success_marks_job_success_and_clears_error(): void
    {
        $order = $this->makeOrder();
        $job = $this->service()->enqueueTest('cashier', null);
        $job->update(['pj_status' => 'claimed', 'pj_attempts' => 1]);

        $this->service()->reportResult($job, true);

        $fresh = $job->fresh();
        $this->assertSame('success', $fresh->pj_status);
        $this->assertNull($fresh->pj_error);
        $this->assertNotNull($fresh->pj_completed_at);
    }

    public function test_report_result_failure_retries_while_under_max_attempts(): void
    {
        $job = $this->service()->enqueueTest('cashier', null);
        $job->update(['pj_status' => 'claimed', 'pj_attempts' => 2, 'pj_max_attempts' => 5]);

        $this->service()->reportResult($job, false, 'printer offline');

        $fresh = $job->fresh();
        $this->assertSame('pending', $fresh->pj_status, 'Should retry (reset to pending) while attempts < max.');
        $this->assertSame('printer offline', $fresh->pj_error);
        $this->assertNull($fresh->pj_completed_at);
    }

    public function test_report_result_failure_goes_terminal_once_attempts_exhausted(): void
    {
        $job = $this->service()->enqueueTest('cashier', null);
        $job->update(['pj_status' => 'claimed', 'pj_attempts' => 5, 'pj_max_attempts' => 5]);

        $this->service()->reportResult($job, false, 'printer offline');

        $fresh = $job->fresh();
        $this->assertSame('failed', $fresh->pj_status);
        $this->assertNotNull($fresh->pj_completed_at);
    }

    // ---------------------------------------------------------------
    // markCartRowsPrinted() — the highest-risk fix in this feature
    // ---------------------------------------------------------------

    public function test_report_result_success_on_kitchen_job_increments_ct_printed_qty_not_overwrites(): void
    {
        // Reproduces the developer's claimed Tinker scenario exactly:
        // ct_printed_qty starts at 2, snapshot qty is 3, result must be 5.
        $ctId = $this->makeCartRow(ctQty: 5, ctPrintedQty: 2);

        $builder = app(PrintJobPayloadBuilder::class);
        $payload = $builder->forKitchen([
            ['pd_id' => 1, 'pd_name' => 'Egg with Rice', 'ct_qty' => 3, 'cat_id' => null, 'ct_id' => $ctId],
        ], 'TKT-QA');

        $job = PrintJob::create([
            'pj_type' => 'kitchen',
            'pj_printer' => 'kitchen',
            'pj_payload' => $payload,
            'pj_status' => 'claimed',
            'pj_attempts' => 1,
        ]);

        $this->service()->reportResult($job, true);

        $row = DB::table('tbl_cart')->where('ct_id', $ctId)->first();
        $this->assertSame(5, (int) $row->ct_printed_qty, 'ct_printed_qty must be incremented (2 + 3), never overwritten.');
    }

    public function test_race_customer_adds_more_items_after_snapshot_only_originally_snapshotted_qty_is_marked_printed(): void
    {
        // Enqueue a kitchen job for qty 4 (ct_printed_qty starts at 0).
        $ctId = $this->makeCartRow(ctQty: 4, ctPrintedQty: 0);

        $builder = app(PrintJobPayloadBuilder::class);
        $payload = $builder->forKitchen([
            ['pd_id' => 1, 'pd_name' => 'Egg with Rice', 'ct_qty' => 4, 'cat_id' => null, 'ct_id' => $ctId],
        ], 'TKT-QA-RACE');

        $job = PrintJob::create([
            'pj_type' => 'kitchen',
            'pj_printer' => 'kitchen',
            'pj_payload' => $payload,
            'pj_status' => 'claimed',
            'pj_attempts' => 1,
        ]);

        // Simulate a customer adding more of the same item to the cart row
        // *before* the agent reports success — ct_qty grows to 9, but the
        // job's snapshot still says 4.
        DB::table('tbl_cart')->where('ct_id', $ctId)->update(['ct_qty' => 9]);

        $this->service()->reportResult($job, true);

        $row = DB::table('tbl_cart')->where('ct_id', $ctId)->first();
        $this->assertSame(
            4,
            (int) $row->ct_printed_qty,
            'ct_printed_qty must reflect only the originally-snapshotted qty (4), not the row\'s new larger ct_qty (9).'
        );
        $this->assertSame(9, (int) $row->ct_qty, 'ct_qty itself must be untouched by the print callback.');
    }

    public function test_report_result_success_on_receipt_job_does_not_touch_cart(): void
    {
        $ctId = $this->makeCartRow(ctQty: 2, ctPrintedQty: 0);
        $order = $this->makeOrder();
        $job = $this->service()->enqueueReceipt($order);
        $job->update(['pj_status' => 'claimed', 'pj_attempts' => 1]);

        $this->service()->reportResult($job, true);

        $row = DB::table('tbl_cart')->where('ct_id', $ctId)->first();
        $this->assertSame(0, (int) $row->ct_printed_qty, 'Receipt job success must not touch unrelated cart rows.');
    }

    // ---------------------------------------------------------------
    // retry()
    // ---------------------------------------------------------------

    public function test_retry_resets_the_same_job_row_rather_than_creating_a_new_one(): void
    {
        $job = $this->service()->enqueueTest('cashier', null);
        $job->update(['pj_status' => 'failed', 'pj_attempts' => 5, 'pj_error' => 'boom']);

        $countBefore = PrintJob::count();

        $returned = $this->service()->retry($job);

        $this->assertSame(PrintJob::count(), $countBefore, 'retry() must not create a new row.');
        $this->assertSame($job->pj_id, $returned->pj_id);

        $fresh = $job->fresh();
        $this->assertSame('pending', $fresh->pj_status);
        $this->assertSame(0, $fresh->pj_attempts);
        $this->assertNull($fresh->pj_error);
    }
}
