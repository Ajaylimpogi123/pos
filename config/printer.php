<?php

return [
    // Which profile printReceipt() uses when no printer name is given
    'default' => env('PRINTER_DEFAULT', 'cashier'),

    // Each key is a printer "name" you'll reference in code —
    // add as many as you have physical printers.
    'printers' => [

        'cashier' => [
            'enabled' => env('PRINTER_CASHIER_ENABLED', true),
            'method' => env('PRINTER_CASHIER_METHOD', 'network'),
            'com_port' => env('PRINTER_CASHIER_COM_PORT', 'COM3'),
            'com_baud' => env('PRINTER_CASHIER_BAUD', 9600),
            'network_ip' => env('PRINTER_CASHIER_IP', '192.168.1.100'),
            'network_port' => env('PRINTER_CASHIER_PORT', 9100),
        ],

        'kitchen' => [
            'enabled' => env('PRINTER_KITCHEN_ENABLED', false),
            'method' => env('PRINTER_KITCHEN_METHOD', 'network'),
            'com_port' => env('PRINTER_KITCHEN_COM_PORT', 'COM4'),
            'com_baud' => env('PRINTER_KITCHEN_BAUD', 9600),
            'network_ip' => env('PRINTER_KITCHEN_IP', '192.168.1.101'),
            'network_port' => env('PRINTER_KITCHEN_PORT', 9100),
        ],

        'bar' => [
            'enabled' => env('PRINTER_BAR_ENABLED', false),
            'method' => env('PRINTER_BAR_METHOD', 'network'),
            'com_port' => env('PRINTER_BAR_COM_PORT', 'COM5'),
            'com_baud' => env('PRINTER_BAR_BAUD', 9600),
            'network_ip' => env('PRINTER_BAR_IP', '192.168.1.102'),
            'network_port' => env('PRINTER_BAR_PORT', 9100),
        ],

        // Add more as needed — e.g. per branch: 'branch_2' => [...]
    ],

    'connect_timeout' => env('PRINTER_TIMEOUT', 2),
    'store_name' => env('PRINTER_STORE_NAME', 'YOUR RESTAURANT NAME'),

    // Maps tbl_category.cat_id to a printer name, so items route to the
    // right physical printer automatically (e.g. drinks -> bar printer,
    // food -> kitchen printer). Leave empty to always use 'default'.
    // Example: [1 => 'kitchen', 2 => 'bar'],
    'category_routing' => [],
];