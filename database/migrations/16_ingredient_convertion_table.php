<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_ingredient_conversion', function (Blueprint $table) {
            $table->id('conv_id');
            $table->unsignedBigInteger('ing_id');

            // Meaning: 1 `from_unit` = `factor` * `to_unit`.
            // `to_unit` is always kept equal to the ingredient's own stock
            // unit at save time — a custom conversion only ever needs to
            // answer "how much of MY stock unit is 1 of this other unit?"
            $table->string('from_unit', 50);
            $table->string('to_unit', 50);
            $table->decimal('factor', 12, 6);

            $table->timestamps();

            $table->foreign('ing_id')
                ->references('ing_id')
                ->on('tbl_ingredient')
                ->cascadeOnDelete();

            // One custom conversion per (ingredient, from_unit) pair —
            // re-saving the same pair updates it instead of duplicating.
            $table->unique(['ing_id', 'from_unit']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_ingredient_conversion');
    }
};