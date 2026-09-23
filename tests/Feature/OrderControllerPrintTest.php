<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Cart;
use App\Models\Order;
use App\Models\PrintJob;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * DatabaseTransactions only — real db_pos database (see PrintJobServiceTest
 * for the full rationale). Covers OrderController::store()'s post-commit
 * print enqueue and both printKitchen() modes.
 */
class OrderControllerPrintTest extends TestCase
{
    use DatabaseTransactions;

    private function actor(): User
    {
        $branch = Branch::firstOrFail();

        return User::factory()->create(['branch_id' => $branch->id, 'role_id' => 1]);
    }

    private function placeOrderPayload(): array
    {
        $product = Product::findOrFail(1);
        $this->assertGreaterThanOrEqual(1, $product->pd_qty, 'Seeded product does not have enough stock for this test.');

        return [
            'payment_method' => 'cash',
            'od_amount_due' => 50,
            'od_discount' => 0,
            'od_total_amt_due' => 50,
            'od_payment' => 50,
            'od_change' => 0,
            'items' => [
                ['pd_id' => $product->pd_id, 'ct_qty' => 1, 'ct_price' => 50],
            ],
        ];
    }

    // ---------------------------------------------------------------
    // store() print enqueue must never affect the checkout response
    // ---------------------------------------------------------------

    public function test_order_place_in_queue_mode_succeeds_and_creates_receipt_print_job(): void
    {
        config(['printer.mode' => 'queue']);

        $before = Order::whereDate('created_at', today())->max('od_id') ?? 0;

        $response = $this->actingAs($this->actor())->post(route('order.place'), $this->placeOrderPayload());

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('menu.menu'));

        $order = Order::whereDate('created_at', today())->where('od_id', '>', $before)->first();
        $this->assertNotNull($order, 'Order should have been created even in queue mode.');

        $job = PrintJob::where('od_id', $order->od_id)->where('pj_type', 'receipt')->first();
        $this->assertNotNull($job, 'A receipt PrintJob should have been enqueued.');
        $this->assertSame('pending', $job->pj_status);
    }

    public function test_order_place_flashes_receipt_print_failed_in_direct_mode_when_printer_unreachable(): void
    {
        config(['printer.mode' => 'direct']);
        // Deterministic, fast connection failure instead of dialing the
        // real (unreachable, not-yet-connected) LAN printer IP.
        config([
            'printer.printers.cashier.enabled' => true,
            'printer.printers.cashier.method' => 'network',
            'printer.printers.cashier.network_ip' => '127.0.0.1',
            'printer.printers.cashier.network_port' => 1,
            'printer.connect_timeout' => 1,
        ]);

        $response = $this->actingAs($this->actor())->post(route('order.place'), $this->placeOrderPayload());

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('menu.menu'));
        $response->assertSessionHas('success', 'Order placed successfully!');
        $response->assertSessionHas('receipt_print_failed', true);
    }

    public function test_order_place_flashes_receipt_print_job_id_in_queue_mode(): void
    {
        config(['printer.mode' => 'queue']);

        $before = Order::whereDate('created_at', today())->max('od_id') ?? 0;

        $response = $this->actingAs($this->actor())->post(route('order.place'), $this->placeOrderPayload());

        $order = Order::whereDate('created_at', today())->where('od_id', '>', $before)->first();
        $job = PrintJob::where('od_id', $order->od_id)->where('pj_type', 'receipt')->first();

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('receipt_print_job_id', $job->pj_id);
        $response->assertSessionHas('receipt_print_failed', false);
    }

    public function test_order_place_still_succeeds_when_print_enqueue_throws(): void
    {
        config(['printer.mode' => 'queue']);

        // Force the enqueue path to throw, simulating any print/enqueue
        // failure — the checkout response must be entirely unaffected.
        $this->app->bind(\App\Services\PrintJobService::class, function () {
            return new class extends \App\Services\PrintJobService
            {
                public function __construct() {}

                public function enqueueReceipt(\App\Models\Order $order, ?string $printerName = null, bool $manual = false): PrintJob
                {
                    throw new \RuntimeException('forced failure for QA test');
                }
            };
        });

        $before = Order::whereDate('created_at', today())->max('od_id') ?? 0;

        $response = $this->actingAs($this->actor())->post(route('order.place'), $this->placeOrderPayload());

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('menu.menu'));
        $response->assertSessionHas('success', 'Order placed successfully!');
        $response->assertSessionHas('receipt_print_failed', true);

        $order = Order::whereDate('created_at', today())->where('od_id', '>', $before)->first();
        $this->assertNotNull($order, 'Order must still be created/committed even though print enqueue threw.');
    }

    // ---------------------------------------------------------------
    // printKitchen()
    // ---------------------------------------------------------------

    private function resetCartWithOneUnprintedRow(int $ctQty = 3, int $ctPrintedQty = 0): int
    {
        // Shared single cart table — clear it inside this test's transaction
        // (rolled back after the test) so pre-existing real cart rows from
        // other in-progress checkouts don't interfere with the assertions.
        Cart::query()->delete();

        $product = Product::findOrFail(1);

        return DB::table('tbl_cart')->insertGetId([
            'pd_id' => $product->pd_id,
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

    public function test_print_kitchen_direct_mode_with_unreachable_printer_returns_gracefully(): void
    {
        config(['printer.mode' => 'direct']);
        // Deterministic, fast connection failure instead of dialing the
        // real (unreachable, not-yet-connected) LAN printer IPs.
        config([
            'printer.printers.kitchen.enabled' => true,
            'printer.printers.kitchen.method' => 'network',
            'printer.printers.kitchen.network_ip' => '127.0.0.1',
            'printer.printers.kitchen.network_port' => 1,
            'printer.connect_timeout' => 1,
            'printer.category_routing' => [],
        ]);

        $ctId = $this->resetCartWithOneUnprintedRow();

        $response = $this->actingAs($this->actor())->post(route('order.printKitchen'));

        $response->assertRedirect();
        $response->assertSessionHas('error');

        $row = DB::table('tbl_cart')->where('ct_id', $ctId)->first();
        $this->assertSame(0, (int) $row->ct_printed_qty, 'Failed print must not mark items as printed.');
    }

    public function test_print_kitchen_queue_mode_creates_print_jobs_without_touching_ct_printed_qty(): void
    {
        config(['printer.mode' => 'queue']);
        config(['printer.category_routing' => []]);

        $ctId = $this->resetCartWithOneUnprintedRow(ctQty: 3, ctPrintedQty: 0);

        $response = $this->actingAs($this->actor())->post(route('order.printKitchen'));

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Kitchen ticket queued for printing.');
        $response->assertSessionHas('print_jobs');

        $jobs = PrintJob::where('pj_type', 'kitchen')->get();
        $this->assertGreaterThanOrEqual(1, $jobs->count(), 'Expected at least one kitchen PrintJob to be created.');

        $row = DB::table('tbl_cart')->where('ct_id', $ctId)->first();
        $this->assertSame(0, (int) $row->ct_printed_qty, 'Queue mode must not synchronously touch ct_printed_qty.');
    }
}
