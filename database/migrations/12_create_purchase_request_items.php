<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tbl_purchase_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')
                  ->constrained('tbl_purchase_request')
                  ->cascadeOnDelete();
                  

            $table->foreignId('ingredient_id')
                  ->nullable()
                  ->constrained(table: 'tbl_ingredient', column: 'ing_id');

                      $table->foreignId('supplier_id')->nullable();
            $table->string('item_name');
            $table->string('unit')->nullable(); // pcs, box, bottle, etc.
            $table->decimal('quantity', 12, 2);
            $table->decimal('estimated_unit_price', 12, 2)->nullable();
            $table->text('remarks')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tbl_purchase_request_items');
    }
};