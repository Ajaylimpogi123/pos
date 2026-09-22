<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyPrintAgentToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-Print-Agent-Token');

        if (! $token || ! hash_equals((string) config('print_agent.token'), (string) $token)) {
            abort(401, 'Invalid print agent token.');
        }

        return $next($request);
    }
}
