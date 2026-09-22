<?php

namespace App\Http\Controllers;

use App\Models\PrintJob;
use App\Services\PrintJobService;
use Illuminate\Http\Request;

class PrintJobStatusController extends Controller
{
    public function index(Request $request)
    {
        $ids = $request->input('ids', []);

        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $validated = validator(['ids' => $ids], [
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer',
        ])->validate();

        $jobs = PrintJob::whereIn('pj_id', $validated['ids'])
            ->get(['pj_id', 'pj_type', 'pj_status', 'pj_error']);

        return response()->json($jobs);
    }

    public function retry(PrintJob $printJob, PrintJobService $printJobService)
    {
        $printJobService->retry($printJob);

        return redirect()->back()->with('success', 'Print job queued for retry.');
    }
}
