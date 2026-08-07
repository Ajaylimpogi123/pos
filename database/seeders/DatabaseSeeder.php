<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Supplier;
use App\Models\Category;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\Branch;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (Role::count() === 0) {
            Role::insert([
                ['id' => 1, 'role_name' => 'Staff', 'created_at' => now(), 'updated_at' => now()],
                ['id' => 2, 'role_name' => 'Admin', 'created_at' => now(), 'updated_at' => now()],
                ['id' => 3, 'role_name' => 'Superadmin', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        if (Supplier::count() === 0) {
            Supplier::insert([
                ['id' => 1, 'supplier_name' => 'JNC', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        if (Category::count() === 0) {
            Category::insert([
                ['cat_id' => 1, 'cat_name' => 'Breakfast', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        $branch = Branch::firstOrCreate([
            'branch_name' => 'Main Branch',
        ]);

        if (Product::count() === 0) {
            Product::insert([
                ['pd_id' => 1, 'cat_id' => 1, 'branch_id' => $branch->id, 'pd_name' => 'Egg with Rice', 'pd_price' => 50.00, 'pd_qty' => 100, 'pd_status' => 'Available', 'created_at' => now(), 'updated_at' => now()],
                ['pd_id' => 2, 'cat_id' => 1, 'branch_id' => $branch->id, 'pd_name' => 'Fried Chicken', 'pd_price' => 100.00, 'pd_qty' => 50, 'pd_status' => 'Available', 'created_at' => now(), 'updated_at' => now()],
                ['pd_id' => 3, 'cat_id' => 1, 'branch_id' => $branch->id, 'pd_name' => 'Hot Dog', 'pd_price' => 80.00, 'pd_qty' => 25, 'pd_status' => 'Available', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }
        if (Ingredient::count() === 0) {
            Ingredient::insert([
                ['ing_id' => 1, 'branch_id' => $branch->id, 'ing_name' => 'salt', 'ing_cost' => 2.50, 'unit' => 'piece', 'ing_qty' => 100, 'ing_mqty' => 50, 'created_at' => now(), 'updated_at' => now()],
                ['ing_id' => 2, 'branch_id' => $branch->id, 'ing_name' => 'Rice', 'ing_cost' => 1.00, 'unit' => 'cup', 'ing_qty' => 50, 'ing_mqty' => 25, 'created_at' => now(), 'updated_at' => now()],
                ['ing_id' => 3, 'branch_id' => $branch->id, 'ing_name' => 'Chicken', 'ing_cost' => 5.00, 'unit' => 'piece', 'ing_qty' => 20, 'ing_mqty' => 10, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        // Only 'email' is used to find an existing row — the rest is only
        // applied when creating. Password is re-hashed every run, so if it
        // were included in the search array this would never match and
        // would throw a duplicate-key error on the second run.
        User::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name'      => 'admin',
                'password'  => Hash::make('password'),
                'role_id'   => 2,
                'branch_id' => $branch->id,
            ]
        );
        User::firstOrCreate(
            ['email' => 'cashier@gmail.com'],
            [
                'name'      => 'cashier',
                'password'  => Hash::make('password'),
                'role_id'   => 1,
                'branch_id' => $branch->id,
            ]
        );
    }
}