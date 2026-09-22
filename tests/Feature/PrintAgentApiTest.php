<?php

namespace Tests\Feature;

use App\Models\PrintJob;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

/**
 * DatabaseTransactions only — real db_pos database (see PrintJobServiceTest
 * for the full rationale). Exercises the token-gated print-agent API.
 */
class PrintAgentApiTest extends TestCase
{
    use DatabaseTransactions;

    private const TOKEN = 'qa-test-print-agent-token';

    protected function setUp(): void
    {
        parent::setUp();

        config(['print_agent.token' => self::TOKEN]);
    }

    private function makeJob(array $overrides = []): PrintJob
    {
        return PrintJob::create(array_merge([
            'pj_type' => 'test',
            'pj_printer' => 'cashier',
            'pj_payload' => [],
            'pj_status' => 'pending',
        ], $overrides));
    }

    // ---------------------------------------------------------------
    // Auth
    // ---------------------------------------------------------------

    public function test_claim_rejects_missing_token(): void
    {
        $this->postJson('/api/print-agent/jobs/claim')->assertStatus(401);
    }

    public function test_claim_rejects_wrong_token(): void
    {
        $this->withHeaders(['X-Print-Agent-Token' => 'wrong'])
            ->postJson('/api/print-agent/jobs/claim')
            ->assertStatus(401);
    }

    public function test_result_rejects_missing_or_wrong_token(): void
    {
        $job = $this->makeJob();

        $this->postJson("/api/print-agent/jobs/{$job->pj_id}/result", ['status' => 'success'])
            ->assertStatus(401);

        $this->withHeaders(['X-Print-Agent-Token' => 'wrong'])
            ->postJson("/api/print-agent/jobs/{$job->pj_id}/result", ['status' => 'success'])
            ->assertStatus(401);
    }

    public function test_ping_rejects_missing_or_wrong_token(): void
    {
        $this->getJson('/api/print-agent/ping')->assertStatus(401);

        $this->withHeaders(['X-Print-Agent-Token' => 'wrong'])
            ->getJson('/api/print-agent/ping')
            ->assertStatus(401);
    }

    // ---------------------------------------------------------------
    // Correct token
    // ---------------------------------------------------------------

    public function test_ping_succeeds_with_correct_token(): void
    {
        $this->withHeaders(['X-Print-Agent-Token' => self::TOKEN])
            ->getJson('/api/print-agent/ping')
            ->assertOk()
            ->assertJson(['ok' => true]);
    }

    public function test_claim_returns_pending_job_with_correct_token_and_no_internal_fields_leaked(): void
    {
        $job = $this->makeJob(['pj_payload' => ['header' => ['invoice_no' => 'INV-1'], 'items' => []]]);

        $response = $this->withHeaders(['X-Print-Agent-Token' => self::TOKEN])
            ->postJson('/api/print-agent/jobs/claim');

        $response->assertOk();
        $data = $response->json();

        $this->assertCount(1, $data);
        $this->assertSame($job->pj_id, $data[0]['pj_id']);
        $this->assertArrayHasKey('pj_payload', $data[0]);
        $this->assertArrayNotHasKey('pj_error', $data[0], 'claim() must not leak internal fields like pj_error.');
        $this->assertArrayNotHasKey('pj_attempts', $data[0]);
        $this->assertArrayNotHasKey('user_id', $data[0]);
    }

    public function test_job_claimed_by_one_request_is_not_returned_by_an_immediately_following_second_claim(): void
    {
        $this->makeJob();

        $headers = ['X-Print-Agent-Token' => self::TOKEN];

        $first = $this->withHeaders($headers)->postJson('/api/print-agent/jobs/claim');
        $first->assertOk();
        $this->assertCount(1, $first->json());

        $second = $this->withHeaders($headers)->postJson('/api/print-agent/jobs/claim');
        $second->assertOk();
        $this->assertCount(0, $second->json(), 'A job claimed by the first request must not be handed out again.');
    }

    public function test_result_endpoint_updates_job_status_with_correct_token(): void
    {
        $job = $this->makeJob(['pj_status' => 'claimed', 'pj_attempts' => 1]);

        $response = $this->withHeaders(['X-Print-Agent-Token' => self::TOKEN])
            ->postJson("/api/print-agent/jobs/{$job->pj_id}/result", ['status' => 'success']);

        $response->assertNoContent();
        $this->assertSame('success', $job->fresh()->pj_status);
    }
}
