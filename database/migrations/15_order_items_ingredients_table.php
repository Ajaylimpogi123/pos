<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tbl_order_item_ingredients', function (Blueprint $table) {
            $table->id('oii_id');
            $table->unsignedBigInteger('oid_id'); // FK -> tbl_order_items.oid_id
            $table->unsignedBigInteger('ing_id');  // FK -> tbl_ingredient.ing_id
            $table->decimal('oii_qty', 10, 2)->default(0); // qty deducted for this order item
            $table->string('unit', 50)->nullable();
            $table->timestamps();

            $table->foreign('oid_id')
                ->references('oid_id')->on('tbl_order_items')
                ->onDelete('cascade');

            $table->foreign('ing_id')
                ->references('ing_id')->on('tbl_ingredient')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_order_item_ingredients');
    }
};