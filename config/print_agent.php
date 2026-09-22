<?php

return [
    // Base URL of the production site the LAN print agent polls (e.g.
    // https://pos.example.com). Only used by the print-agent:run command.
    'base_url' => env('PRINT_AGENT_BASE_URL'),

    // Shared secret sent as the X-Print-Agent-Token header on every
    // agent request and checked by VerifyPrintAgentToken.
    'token' => env('PRINT_AGENT_TOKEN'),

    // Max number of jobs claimed per poll.
    'claim_limit' => env('PRINT_AGENT_CLAIM_LIMIT', 5),

    // Seconds between polls when running the agent in a loop.
    'poll_interval' => env('PRINT_AGENT_POLL_INTERVAL', 3),

    // A 'claimed' job older than this (and still under pj_max_attempts)
    // is considered abandoned (agent crashed mid-print) and eligible to
    // be claimed again.
    'stale_claim_minutes' => env('PRINT_AGENT_STALE_MINUTES', 2),
];
