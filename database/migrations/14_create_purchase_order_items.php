<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')
                  ->constrained('tbl_purchase_order')
                  ->cascadeOnDelete();

            $table->foreignId('ingredient_id')
                  ->nullable()
                  ->constrained(table: 'tbl_ingredient', column: 'ing_id');
            $table->string('item_name');
            $table->string('unit')->nullable();
            $table->decimal('quantity', 12, 2);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('subtotal', 14, 2)->default(0); // quantity * unit_price

            // Useful once goods start arriving (partial deliveries etc.)
            $table->decimal('quantity_received', 12, 2)->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_purchase_order_items');
    }
};