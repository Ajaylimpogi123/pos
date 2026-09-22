<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tbl_purchase_request_items', function (Blueprint $table) {
            $table->foreign('supplier_id')->references('id')->on('tbl_supplier');
        });

        Schema::table('tbl_purchase_order', function (Blueprint $table) {
            $table->foreign('supplier_id')->references('id')->on('tbl_supplier');
        });
    }

    public function down(): void
    {
        Schema::table('tbl_purchase_request_items', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
        });

        Schema::table('tbl_purchase_order', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
        });
    }
};
