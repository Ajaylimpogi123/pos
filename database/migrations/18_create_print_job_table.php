<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_print_job', function (Blueprint $table) {
            $table->id('pj_id');

            $table->string('pj_type', 20); // receipt | kitchen | test
            $table->string('pj_printer', 50);

            $table->unsignedBigInteger('od_id')->nullable();
            $table->foreign('od_id')
                ->references('od_id')
                ->on('tbl_order')
                ->nullOnDelete();

            // Fully self-contained job payload — the agent never touches
            // the database directly, only what's snapshotted here.
            $table->json('pj_payload');

            $table->string('pj_status', 20)->default('pending'); // pending | claimed | success | failed
            $table->unsignedTinyInteger('pj_attempts')->default(0);
            $table->unsignedTinyInteger('pj_max_attempts')->default(5);
            $table->text('pj_error')->nullable();

            $table->boolean('pj_is_manual')->default(false);
            $table->unsignedBigInteger('user_id')->nullable();

            $table->timestamp('pj_claimed_at')->nullable();
            $table->timestamp('pj_completed_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_print_job');
    }
};
