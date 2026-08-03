<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_purchase_request', function (Blueprint $table) {
            $table->id();
            $table->string('pr_number')->unique(); // e.g. PR-2026-00001

            // Who raised it / which department or branch it's for
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('branch_id')->constrained('tbl_branch');

            $table->date('date_needed')->nullable();
            $table->text('remarks')->nullable();

            // --- Approval workflow ---
            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'cancelled',
                'converted', // already turned into a Purchase Order
            ])->default('pending');

            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_remarks')->nullable(); // e.g. rejection reason

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_purchase_request');
    }
};