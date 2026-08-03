<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Supplier extends Model
{
    use HasFactory;

    protected $table = 'tbl_supplier';
    protected $primaryKey = 'id';

    protected $fillable = [
        'supplier_name',
        'contact_person',
        'contact_number',
        'email',
        'address'
    ];
}
