<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
      Schema::create('tbl_ingredient', function (Blueprint $table) {
        $table->id('ing_id');
    

     
         $table->string('ing_name', 244)->default('');
           $table->bigInteger('ing_qty')->default(0);
         $table->string('unit', 244)->default('');
         $table->bigInteger('ing_mqty')->default(0);
          $table->decimal('ing_cost', 10, 2)->default(0);
          $table->string('ing_image', 240)->nullable();
          $table->string('ing_status', 100)->nullable();
        $table->timestamps();
      $table->softDeletes();

    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbl_ingredient');
    }
};