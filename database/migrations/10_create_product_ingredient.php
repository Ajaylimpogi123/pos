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
      Schema::create('tbl_product_ingredient', function (Blueprint $table) {
            $table->id('pd_ing_id');
            $table->unsignedBigInteger('pd_id'); // ✅ MATCH
            $table->unsignedBigInteger('ing_id'); // ✅ MATCH

       

            $table->decimal('pd_ing_qty', 10, 2)->default(0.00);

            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('pd_id')
            ->references('pd_id')
            ->on('tbl_product')
            ->cascadeOnDelete();

            $table->foreign('ing_id')
            ->references('ing_id')
            ->on('tbl_ingredient')
            ->cascadeOnDelete();


    });
    }
     /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_product_ingredient');
    }

};
