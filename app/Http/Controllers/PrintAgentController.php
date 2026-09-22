<?php

namespace App\Http\Controllers;

use App\Models\PrintJob;
use App\Services\PrintJobService;
use Illuminate\Http\Request;

class PrintAgentController extends Controller
{
    public function claim(Request $request, PrintJobService $printJobService)
    {
        $validated = $request->validate([
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $limit = $validated['limit'] ?? config('print_agent.claim_limit');

        $jobs = $printJobService->claimNext($limit);

        return response()->json(
            $jobs->map(fn (PrintJob $job) => [
                'pj_id' => $job->pj_id,
                'pj_type' => $job->pj_type,
                'pj_printer' => $job->pj_printer,
                'pj_payload' => $job->pj_payload,
            ])->values()
        );
    }

    public function result(Request $request, PrintJob $printJob, PrintJobService $printJobService)
    {
        $validated = $request->validate([
            'status' => 'required|in:success,failed',
            'error' => 'nullable|string',
        ]);

        $printJobService->reportResult($printJob, $validated['status'] === 'success', $validated['error'] ?? null);

        return response()->noContent();
    }

    public function ping()
    {
        return response()->json(['ok' => true]);
    }
}
