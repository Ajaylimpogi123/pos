<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_purchase_order', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->unique(); // e.g. PO-2026-00001

            // Optional link back to the PR it was generated from
            $table->foreignId('purchase_request_id')
                  ->nullable()
                  ->constrained('tbl_purchase_request')
                  ->nullOnDelete();

            $table->foreignId('branch_id')->constrained('tbl_branch');
            $table->foreignId('supplier_id')->nullable()->constrained('tbl_supplier');
            $table->foreignId('created_by')->constrained('users');

            $table->date('order_date')->nullable();
            $table->date('expected_delivery_date')->nullable();
            $table->text('remarks')->nullable();

            $table->decimal('total_amount', 14, 2)->default(0);

            // --- Approval workflow ---
            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'cancelled',
                'partially_received',
                'received',
                'closed',
            ])->default('pending');

            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_remarks')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_purchase_order');
    }
};