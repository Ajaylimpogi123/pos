<?php

namespace Tests\Feature;

use App\Services\ReceiptPrinterService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Covers `print-agent:run --once` from two angles, deliberately kept
 * separate rather than one end-to-end test:
 *
 *  1. "Does printing actually transmit bytes?" — exercised directly against
 *     ReceiptPrinterService::printFromPayload() talking to a real local TCP
 *     listener (stream_socket_server on an OS-assigned port), standing in
 *     for the physical thermal printer that isn't connected yet. This is
 *     the piece that matters for confidence the ESC/POS bytes really go
 *     out over the wire.
 *  2. "Does the command call the right endpoints correctly?" — exercised
 *     via Http::fake() against the Artisan command itself, with the
 *     printer service faked out so no real socket I/O happens in this half.
 *
 * Standing up a full local HTTP server (e.g. via `artisan serve`) to test
 * the real claim/report round trip end-to-end would add process-management
 * flakiness for no extra confidence: the claim/report HTTP contract is
 * already covered against the real routes in PrintAgentApiTest, and the
 * command's *use* of that contract (headers, body shape, endpoint paths)
 * is exactly what Http::fake() verifies here.
 */
class PrintAgentRunCommandTest extends TestCase
{
    use DatabaseTransactions;

    public function test_print_from_payload_transmits_bytes_to_a_real_tcp_listener(): void
    {
        $server = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
        $this->assertNotFalse($server, "Could not start fake printer socket: {$errstr}");

        $name = stream_socket_get_name($server, false);
        $port = (int) substr($name, strrpos($name, ':') + 1);

        config([
            'printer.printers.cashier.enabled' => true,
            'printer.printers.cashier.method' => 'network',
            'printer.printers.cashier.network_ip' => '127.0.0.1',
            'printer.printers.cashier.network_port' => $port,
            'printer.connect_timeout' => 2,
        ]);

        $service = app(ReceiptPrinterService::class);
        $success = $service->printFromPayload('cashier', 'test', []);

        $this->assertTrue($success, 'printFromPayload should report success when the fake socket accepts the connection.');

        // Drain the backlog: the service opens one short-lived connection
        // to check reachability (no bytes) before opening the real one it
        // writes the ticket to, so accept in a loop until we see data.
        $received = '';
        $deadline = microtime(true) + 5;

        while (microtime(true) < $deadline && $received === '') {
            $conn = @stream_socket_accept($server, 1);
            if ($conn === false) {
                continue;
            }
            stream_set_timeout($conn, 1);
            $chunk = fread($conn, 8192);
            fclose($conn);
            if ($chunk !== false && $chunk !== '') {
                $received = $chunk;
            }
        }

        fclose($server);

        $this->assertNotEmpty($received, 'Expected ESC/POS bytes to actually be written to the socket.');
        $this->assertStringContainsString('TEST PRINT', $received);
        $this->assertStringContainsString('CASHIER', $received);
    }

    public function test_command_calls_claim_and_result_endpoints_with_correct_shape_and_exits_after_once(): void
    {
        config([
            'print_agent.base_url' => 'http://print-agent.test',
            'print_agent.token' => 'qa-command-token',
            'print_agent.claim_limit' => 5,
        ]);

        Http::fake([
            'print-agent.test/api/print-agent/jobs/claim' => Http::response([
                [
                    'pj_id' => 999001,
                    'pj_type' => 'test',
                    'pj_printer' => 'cashier',
                    'pj_payload' => [],
                ],
            ], 200),
            'print-agent.test/api/print-agent/jobs/999001/result' => Http::response('', 204),
        ]);

        // Isolate this half from real socket I/O — byte transmission is
        // already verified above.
        $this->app->instance(ReceiptPrinterService::class, new class extends ReceiptPrinterService
        {
            public function printFromPayload(string $printerName, string $type, array $payload): bool
            {
                return true;
            }
        });

        $this->artisan('print-agent:run', ['--once' => true])
            ->assertExitCode(0);

        Http::assertSentCount(2);

        Http::assertSent(function ($request) {
            return $request->url() === 'http://print-agent.test/api/print-agent/jobs/claim'
                && $request->hasHeader('X-Print-Agent-Token', 'qa-command-token')
                && $request['limit'] === 5;
        });

        Http::assertSent(function ($request) {
            return $request->url() === 'http://print-agent.test/api/print-agent/jobs/999001/result'
                && $request->hasHeader('X-Print-Agent-Token', 'qa-command-token')
                && $request['status'] === 'success';
        });
    }

    public function test_command_reports_failure_result_when_printer_service_returns_false(): void
    {
        config([
            'print_agent.base_url' => 'http://print-agent.test',
            'print_agent.token' => 'qa-command-token',
            'print_agent.claim_limit' => 5,
        ]);

        Http::fake([
            'print-agent.test/api/print-agent/jobs/claim' => Http::response([
                [
                    'pj_id' => 999002,
                    'pj_type' => 'test',
                    'pj_printer' => 'cashier',
                    'pj_payload' => [],
                ],
            ], 200),
            'print-agent.test/api/print-agent/jobs/999002/result' => Http::response('', 204),
        ]);

        $this->app->instance(ReceiptPrinterService::class, new class extends ReceiptPrinterService
        {
            public function printFromPayload(string $printerName, string $type, array $payload): bool
            {
                return false;
            }
        });

        $this->artisan('print-agent:run', ['--once' => true])
            ->assertExitCode(0);

        Http::assertSent(function ($request) {
            return $request->url() === 'http://print-agent.test/api/print-agent/jobs/999002/result'
                && $request['status'] === 'failed'
                && ! empty($request['error']);
        });
    }
}
